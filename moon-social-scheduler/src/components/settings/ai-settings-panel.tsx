"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SparklesIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

type AiSettingsResponse = {
  configured: boolean
  source: "workspace" | "hosted" | "missing"
  provider: string
  model: string | null
  apiKey: string | null
  hasCustomOverride: boolean
  hostedAvailable: boolean
  canUseCustomCredentials: boolean
}

export function AiSettingsPanel() {
  const queryClient = useQueryClient()
  const [provider, setProvider] = React.useState("openrouter")
  const [model, setModel] = React.useState("")
  const [apiKey, setApiKey] = React.useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/ai")
      if (!res.ok) throw new Error("No se pudo cargar la configuración de IA")
      return res.json() as Promise<AiSettingsResponse>
    },
  })

  React.useEffect(() => {
    if (data?.provider) setProvider(data.provider)
    if (data?.model) setModel(data.model)
  }, [data])

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/integrations/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model: model || undefined, apiKey }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || payload.error || "Error al guardar")
      return payload
    },
    onSuccess: () => {
      toast.success("Configuración de IA guardada")
      setApiKey("")
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Error"),
  })

  const reset = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/integrations/ai", { method: "DELETE" })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.message || payload.error || "Error al resetear")
      return payload
    },
    onSuccess: () => {
      toast.success("Usando IA incluida en Postall")
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Error"),
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando IA…</p>
  }

  if (!data) return null

  const showIncludedMessage = data.hostedAvailable && !data.hasCustomOverride

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5" />
          Inteligencia artificial
        </CardTitle>
        <CardDescription>
          Captions, Brand Agent y asistentes usan este proveedor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showIncludedMessage ? (
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-sm">
            <Badge className="mb-2">IA incluida en tu plan</Badge>
            <p className="text-muted-foreground">
              Postall gestiona el proveedor ({data.provider}
              {data.model ? ` · ${data.model}` : ""}). No necesitas configurar nada.
            </p>
          </div>
        ) : null}

        {data.canUseCustomCredentials ? (
          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Proveedor personalizado (Agency)</p>
            <div className="grid gap-3 md:grid-cols-2">
              <Field>
                <FieldLabel>Proveedor</FieldLabel>
                <Select
                  value={provider}
                  onValueChange={(value) => value && setProvider(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Modelo</FieldLabel>
                <Input
                  placeholder="deepseek/deepseek-chat-v3-0324"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>API Key</FieldLabel>
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder={
                    data.apiKey ? `Actual: ${data.apiKey}` : "sk-or-... / sk-... / sk-ant-..."
                  }
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={!apiKey || save.isPending}
                onClick={() => save.mutate()}
              >
                Guardar
              </Button>
              {data.hasCustomOverride ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={reset.isPending}
                  onClick={() => reset.mutate()}
                >
                  <Trash2Icon data-icon="inline-start" aria-hidden="true" />
                  Usar IA de Postall
                </Button>
              ) : null}
            </div>
          </div>
        ) : !data.hostedAvailable ? (
          <p className="text-sm text-muted-foreground">
            La IA no está disponible en este momento. Contacta con soporte.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
