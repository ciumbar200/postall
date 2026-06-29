"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ChevronDownIcon,
  CopyIcon,
  ExternalLinkIcon,
  PlugZapIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type PlatformFieldLabels = {
  clientId: string
  clientSecret: string
  clientIdPlaceholder: string
  clientSecretPlaceholder: string
}

export type PlatformSetupInfo = {
  slug: string
  name: string
  authType: "oauth" | "token"
  configured: boolean
  credentialSource: "workspace" | "hosted" | "missing"
  canUseCustomCredentials: boolean
  redirectUri: string | null
  summary: string
  devConsoleLinks: Array<{ label: string; href: string }>
  fieldLabels?: PlatformFieldLabels
  steps: Array<{ title: string; detail: string }>
  notes: string[]
  requiresAppReview?: boolean
}

function copyText(value: string, label: string) {
  navigator.clipboard.writeText(value)
  toast.success(`${label} copiado`)
}

export function PlatformConnectCard({
  platform,
  connected,
  defaultOpen = false,
}: {
  platform: PlatformSetupInfo
  connected: boolean
  defaultOpen?: boolean
}) {
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(defaultOpen)
  const [showCustom, setShowCustom] = React.useState(
    platform.credentialSource === "workspace"
  )
  const [clientId, setClientId] = React.useState("")
  const [clientSecret, setClientSecret] = React.useState("")
  const [blueskyHandle, setBlueskyHandle] = React.useState("")
  const [blueskyPassword, setBlueskyPassword] = React.useState("")
  const [telegramToken, setTelegramToken] = React.useState("")
  const [telegramChatId, setTelegramChatId] = React.useState("")

  const tokenConnect = useMutation({
    mutationFn: async (body: Record<string, string>) => {
      const response = await fetch("/api/accounts/connect-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "No se pudo conectar")
      return payload
    },
    onSuccess: () => {
      toast.success(`${platform.name} conectado`)
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["billing-summary"] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Error"),
  })

  const saveCustomCredentials = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/integrations/platforms/${platform.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message || payload.error || "Error al guardar")
      return payload
    },
    onSuccess: () => {
      toast.success(`Credenciales de ${platform.name} guardadas`)
      queryClient.invalidateQueries({ queryKey: ["accounts-setup"] })
      setClientId("")
      setClientSecret("")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Error"),
  })

  const resetCustomCredentials = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/integrations/platforms/${platform.slug}`, {
        method: "DELETE",
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message || payload.error || "Error al resetear")
      return payload
    },
    onSuccess: () => {
      toast.success(`Usando apps de Postall para ${platform.name}`)
      queryClient.invalidateQueries({ queryKey: ["accounts-setup"] })
      setShowCustom(false)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Error"),
  })

  function connectOAuth() {
    if (!platform.configured) {
      setOpen(true)
      toast.message("Integración no disponible aún", {
        description:
          "Esta red estará lista pronto. Si eres Agency, puedes usar tu propia app abajo.",
      })
      return
    }
    window.location.href = `/api/accounts/${platform.slug}/connect`
  }

  const statusBadge = connected ? (
    <Badge variant="secondary">Conectada</Badge>
  ) : platform.configured ? (
    <Badge>Listo para conectar</Badge>
  ) : (
    <Badge variant="outline">Próximamente</Badge>
  )

  return (
    <article
      id={`platform-${platform.slug}`}
      className={cn(
        "rounded-xl border bg-card",
        defaultOpen && "ring-2 ring-primary/40",
        connected && "border-primary/30"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{platform.name}</h3>
            {statusBadge}
            {platform.credentialSource === "workspace" ? (
              <Badge variant="outline">App propia</Badge>
            ) : null}
            {platform.requiresAppReview ? (
              <Badge variant="outline">Requiere revisión de app</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{platform.summary}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {platform.authType === "oauth" ? (
            <Button size="sm" onClick={connectOAuth} disabled={connected || !platform.configured}>
              <PlugZapIcon data-icon="inline-start" aria-hidden="true" />
              {connected ? "Conectada" : "Conectar"}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-expanded={open}
            aria-controls={`setup-${platform.slug}`}
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Ocultar guía" : "Ver guía de configuración"}
          >
            <ChevronDownIcon
              className={cn("transition-transform", open && "rotate-180")}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      {open ? (
        <div id={`setup-${platform.slug}`} className="space-y-4 border-t px-4 pb-4 pt-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Consolas de desarrollador
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {platform.devConsoleLinks.map((link) => (
                <li key={link.href}>
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <a href={link.href} target="_blank" rel="noopener noreferrer" />
                    }
                  >
                    {link.label}
                    <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          {platform.redirectUri ? (
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                OAuth Redirect URI (pégala en la consola del proveedor)
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 break-all text-xs">{platform.redirectUri}</code>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Copiar redirect URI"
                  onClick={() => copyText(platform.redirectUri!, "Redirect URI")}
                >
                  <CopyIcon aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : null}

          <ol className="space-y-3">
            {platform.steps.map((step, index) => (
              <li key={step.title} className="flex gap-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <div>
                  <div className="font-medium">{step.title}</div>
                  <div className="text-muted-foreground">{step.detail}</div>
                </div>
              </li>
            ))}
          </ol>

          {platform.notes.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {platform.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}

          {platform.authType === "oauth" &&
          platform.canUseCustomCredentials &&
          platform.fieldLabels ? (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Usar mi propia app (Agency)</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustom((value) => !value)}
                >
                  {showCustom ? "Ocultar" : "Mostrar"}
                </Button>
              </div>
              {showCustom ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor={`cid-${platform.slug}`}>
                      {platform.fieldLabels.clientId}
                    </FieldLabel>
                    <Input
                      id={`cid-${platform.slug}`}
                      placeholder={platform.fieldLabels.clientIdPlaceholder}
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`csec-${platform.slug}`}>
                      {platform.fieldLabels.clientSecret}
                    </FieldLabel>
                    <Input
                      id={`csec-${platform.slug}`}
                      type="password"
                      autoComplete="off"
                      placeholder={platform.fieldLabels.clientSecretPlaceholder}
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2 md:col-span-2">
                    <Button
                      size="sm"
                      disabled={
                        !clientId ||
                        !clientSecret ||
                        saveCustomCredentials.isPending
                      }
                      onClick={() => saveCustomCredentials.mutate()}
                    >
                      Guardar credenciales
                    </Button>
                    {platform.credentialSource === "workspace" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={resetCustomCredentials.isPending}
                        onClick={() => resetCustomCredentials.mutate()}
                      >
                        <Trash2Icon data-icon="inline-start" aria-hidden="true" />
                        Usar apps de Postall
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {platform.authType === "token" && !connected ? (
            <div className="grid gap-3 rounded-lg border p-3 md:grid-cols-2">
              {platform.slug === "bluesky" ? (
                <>
                  <Field>
                    <FieldLabel htmlFor={`bsky-${platform.slug}`}>Handle</FieldLabel>
                    <Input
                      id={`bsky-${platform.slug}`}
                      placeholder="usuario.bsky.social"
                      value={blueskyHandle}
                      onChange={(e) => setBlueskyHandle(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`bsky-pw-${platform.slug}`}>App password</FieldLabel>
                    <Input
                      id={`bsky-pw-${platform.slug}`}
                      type="password"
                      autoComplete="off"
                      placeholder="xxxx-xxxx-xxxx-xxxx"
                      value={blueskyPassword}
                      onChange={(e) => setBlueskyPassword(e.target.value)}
                    />
                  </Field>
                  <Button
                    className="md:col-span-2"
                    disabled={!blueskyHandle || !blueskyPassword || tokenConnect.isPending}
                    onClick={() =>
                      tokenConnect.mutate({
                        platform: "bluesky",
                        handle: blueskyHandle,
                        appPassword: blueskyPassword,
                      })
                    }
                  >
                    Conectar Bluesky
                  </Button>
                </>
              ) : (
                <>
                  <Field>
                    <FieldLabel htmlFor={`tg-token-${platform.slug}`}>Bot token</FieldLabel>
                    <Input
                      id={`tg-token-${platform.slug}`}
                      type="password"
                      autoComplete="off"
                      placeholder="123456:ABC..."
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`tg-chat-${platform.slug}`}>Chat ID</FieldLabel>
                    <Input
                      id={`tg-chat-${platform.slug}`}
                      placeholder="@micanal o -1001234567890"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                    />
                  </Field>
                  <Button
                    className="md:col-span-2"
                    disabled={!telegramToken || !telegramChatId || tokenConnect.isPending}
                    onClick={() =>
                      tokenConnect.mutate({
                        platform: "telegram",
                        botToken: telegramToken,
                        chatId: telegramChatId,
                      })
                    }
                  >
                    Conectar Telegram
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
