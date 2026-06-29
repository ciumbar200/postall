"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CopyIcon, Trash2Icon, WebhookIcon } from "lucide-react"
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

type Webhook = {
  id: string
  url: string
  events: string[]
  active: boolean
  lastStatus: number | null
  lastDeliveredAt: string | null
}

export function WebhooksManager() {
  const queryClient = useQueryClient()
  const [url, setUrl] = React.useState("")
  const [createdSecret, setCreatedSecret] = React.useState<string | null>(null)

  const { data } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const response = await fetch("/api/webhooks")
      if (!response.ok) throw new Error("No se pudieron cargar los webhooks")
      return response.json() as Promise<{ webhooks: Webhook[]; availableEvents: string[] }>
    },
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, events: [] }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Error creando el webhook")
      return payload as { secret: string }
    },
    onSuccess: (payload) => {
      setCreatedSecret(payload.secret)
      setUrl("")
      queryClient.invalidateQueries({ queryKey: ["webhooks"] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Error"),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch("/api/webhooks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["webhooks"] }),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WebhookIcon className="size-4" />
          Webhooks
        </CardTitle>
        <CardDescription>
          Recibe eventos (publicado, fallido, programado) en tu endpoint. Firmados con
          HMAC-SHA256 en la cabecera <code>Postall-Signature</code>. Incluido en Agent y Agency.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <Field className="flex-1">
            <FieldLabel htmlFor="webhook-url">URL del endpoint</FieldLabel>
            <Input
              id="webhook-url"
              placeholder="https://tu-servicio.com/webhooks/postall"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </Field>
          <Button onClick={() => createMutation.mutate()} disabled={!url || createMutation.isPending}>
            Añadir
          </Button>
        </div>

        {createdSecret ? (
          <div className="rounded-lg border border-primary/50 bg-primary/5 p-3">
            <div className="text-sm font-medium">Secreto de firma (cópialo ahora):</div>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-background px-2 py-1 text-xs">
                {createdSecret}
              </code>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => {
                  navigator.clipboard.writeText(createdSecret)
                  toast.success("Copiado")
                }}
              >
                <CopyIcon />
              </Button>
            </div>
          </div>
        ) : null}

        {data?.webhooks.length ? (
          <ul className="divide-y">
            {data.webhooks.map((hook) => (
              <li key={hook.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{hook.url}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={hook.lastStatus && hook.lastStatus < 300 ? "secondary" : "outline"}>
                      {hook.lastStatus ? `HTTP ${hook.lastStatus}` : "sin entregas"}
                    </Badge>
                    {hook.events.length ? hook.events.join(", ") : "todos los eventos"}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Eliminar"
                  onClick={() => deleteMutation.mutate(hook.id)}
                >
                  <Trash2Icon />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Aún no hay webhooks configurados.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
