"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CopyIcon, KeyRoundIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"

type ApiKey = {
  id: string
  name: string
  prefix: string
  scopes: string[]
  rateLimitPerMin: number
  lastUsedAt: string | null
  createdAt: string
}

export function ApiKeysManager() {
  const queryClient = useQueryClient()
  const [name, setName] = React.useState("")
  const [createdKey, setCreatedKey] = React.useState<string | null>(null)

  const { data } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const response = await fetch("/api/keys")
      if (!response.ok) throw new Error("No se pudieron cargar las API keys")
      return response.json() as Promise<{ keys: ApiKey[]; availableScopes: string[] }>
    },
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, scopes: [], rateLimitPerMin: 60 }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Error creando la key")
      return payload as { fullKey: string }
    },
    onSuccess: (payload) => {
      setCreatedKey(payload.fullKey)
      setName("")
      queryClient.invalidateQueries({ queryKey: ["api-keys"] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Error"),
  })

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
  })

  function copy(value: string) {
    navigator.clipboard.writeText(value)
    toast.success("Copiado al portapapeles")
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRoundIcon className="size-4" />
            API Keys
          </CardTitle>
          <CardDescription>
            Crea claves para usar la API REST de Postall y el servidor MCP desde tus agentes
            (OpenClaw). La clave completa se muestra una sola vez.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <Field className="flex-1">
              <FieldLabel htmlFor="key-name">Nombre de la key</FieldLabel>
              <Input
                id="key-name"
                placeholder="Producción OpenClaw"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!name || createMutation.isPending}
            >
              Crear key
            </Button>
          </div>

          {createdKey ? (
            <div className="rounded-lg border border-primary/50 bg-primary/5 p-3">
              <div className="text-sm font-medium">Tu nueva API key (cópiala ahora):</div>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-background px-2 py-1 text-xs">
                  {createdKey}
                </code>
                <Button variant="outline" size="icon-sm" onClick={() => copy(createdKey)}>
                  <CopyIcon />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keys activas</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.keys.length ? (
            <ul className="divide-y">
              {data.keys.map((key) => (
                <li key={key.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{key.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {key.prefix}··· · {key.rateLimitPerMin} req/min ·{" "}
                      {key.lastUsedAt
                        ? `usada ${new Date(key.lastUsedAt).toLocaleDateString()}`
                        : "sin uso"}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {key.scopes.length ? (
                        key.scopes.map((scope) => (
                          <Badge key={scope} variant="secondary">
                            {scope}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary">acceso total</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Revocar"
                    onClick={() => revokeMutation.mutate(key.id)}
                  >
                    <Trash2Icon />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Todavía no hay keys. El plan Agent incluye acceso a la API y MCP.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
