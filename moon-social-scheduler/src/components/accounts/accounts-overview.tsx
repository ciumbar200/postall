"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { RefreshCwIcon, UnplugIcon } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Platform } from "@/lib/domain/enums"
import { formatUtcDate } from "@/lib/ui/dates"
import { useAccounts } from "@/hooks/use-dashboard-data"
import { platformMeta } from "@/lib/ui/platforms"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlatformPill } from "@/components/shared/platform-pill"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  PlatformConnectCard,
  type PlatformSetupInfo,
} from "@/components/accounts/platform-connect-card"

type AccountHealth = {
  label: string
  tone: "ok" | "warn" | "error"
  needsReconnect: boolean
}

function getHealth(status: string, expiresAt?: string | null): AccountHealth {
  if (status === "EXPIRED" || status === "ERROR" || status === "REVOKED") {
    return { label: "Reconexión necesaria", tone: "error", needsReconnect: true }
  }

  if (expiresAt) {
    const msLeft = new Date(expiresAt).getTime() - Date.now()
    const days = msLeft / (1000 * 60 * 60 * 24)
    if (days <= 0) {
      return { label: "Token caducado", tone: "error", needsReconnect: true }
    }
    if (days <= 3) {
      return { label: `Caduca en ${Math.ceil(days)} d`, tone: "warn", needsReconnect: false }
    }
  }

  return { label: "Saludable", tone: "ok", needsReconnect: false }
}

const toneClass: Record<AccountHealth["tone"], string> = {
  ok: "text-emerald-500",
  warn: "text-amber-500",
  error: "text-red-500",
}

export function AccountsOverview() {
  const searchParams = useSearchParams()
  const setupSlug = searchParams.get("setup")
  const connectedSlug = searchParams.get("connected")

  const { data: accounts = [], isSuccess: accountsLoaded } = useAccounts()
  const queryClient = useQueryClient()

  const { data: setupData } = useQuery({
    queryKey: ["accounts-setup"],
    queryFn: async () => {
      const response = await fetch("/api/accounts/setup")
      if (!response.ok) throw new Error("No se pudo cargar la guía de conexión")
      return response.json() as Promise<{ platforms: PlatformSetupInfo[]; appUrl: string }>
    },
    retry: false,
  })

  React.useEffect(() => {
    if (connectedSlug) {
      toast.success(`Cuenta de ${connectedSlug} conectada correctamente`)
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
    }
  }, [connectedSlug, queryClient])

  React.useEffect(() => {
    if (setupSlug) {
      const element = document.getElementById(`platform-${setupSlug}`)
      element?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [setupSlug, setupData])

  const disconnect = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!response.ok) throw new Error("No se pudo desconectar la cuenta")
    },
    onSuccess: () => {
      toast.success("Cuenta desconectada")
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Error"),
  })

  function reconnect(platform: Platform) {
    const meta = platformMeta[platform]
    window.location.href = `/api/accounts/${meta.slug}/connect`
  }

  const activeAccounts = accounts.filter((a) => a.status !== "REVOKED")
  const configuredCount =
    setupData?.platforms.filter((p) => p.configured).length ?? 0

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Conectar redes sociales</CardTitle>
          <CardDescription>
            Conecta tus cuentas con un clic. Si eres Agency, puedes usar tu propia app de
            desarrollador en la guía de cada red.
            {setupData ? (
              <>
                {" "}
                {configuredCount} de {setupData.platforms.length} integraciones disponibles.
              </>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {setupData?.platforms.map((platform) => {
            const metaSlug = platform.slug
            const connected = activeAccounts.some(
              (account) =>
                platformMeta[account.platform as Platform]?.slug === metaSlug &&
                account.status === "CONNECTED"
            )
            return (
              <PlatformConnectCard
                key={platform.slug}
                platform={platform}
                connected={connected}
                defaultOpen={setupSlug === platform.slug || !platform.configured}
              />
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cuentas conectadas</CardTitle>
          <CardDescription>
            Estado real de las identidades vinculadas a tu workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accountsLoaded && activeAccounts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay cuentas conectadas. Elige una red arriba, configura las credenciales si
              hace falta y pulsa Conectar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Salud</TableHead>
                  <TableHead>Caducidad token</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <PlatformPill platform={account.platform} />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{account.displayName ?? account.username}</div>
                      <div className="text-xs text-muted-foreground">@{account.username}</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={account.status} />
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const health = getHealth(account.status, account.expiresAt)
                        return (
                          <span className={`text-xs font-medium ${toneClass[health.tone]}`}>
                            {health.label}
                          </span>
                        )
                      })()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {account.expiresAt ? formatUtcDate(account.expiresAt) : "Sin caducidad"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {getHealth(account.status, account.expiresAt).needsReconnect ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => reconnect(account.platform)}
                          >
                            <RefreshCwIcon data-icon="inline-start" />
                            Reconectar
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Desconectar"
                          onClick={() => disconnect.mutate(account.id)}
                          disabled={disconnect.isPending}
                        >
                          <UnplugIcon />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
