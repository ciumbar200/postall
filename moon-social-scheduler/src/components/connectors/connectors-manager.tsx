"use client"

import * as React from "react"
import { useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  PlugIcon,
  CheckIcon,
  Loader2Icon,
  ExternalLinkIcon,
  AlertCircleIcon,
} from "lucide-react"

type ConnectorGuide = {
  title: string
  description: string
  authType: "api_key" | "oauth"
  docsUrl: string
  fields: Array<{
    key: string
    label: string
    placeholder: string
    type?: "password" | "text"
  }>
  steps: string[]
  testPayload?: Record<string, unknown>
}

interface Connector {
  type: string
  name: string
  capabilities: string[]
  configured: boolean
  guide?: ConnectorGuide
}

export function ConnectorsManager() {
  const searchParams = useSearchParams()
  const [connectors, setConnectors] = React.useState<Connector[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldValues, setFieldValues] = React.useState<Record<string, Record<string, string>>>({})
  const [saving, setSaving] = React.useState<string | null>(null)
  const [testing, setTesting] = React.useState<string | null>(null)

  const flash = useMemo(() => {
    const err = searchParams.get("error")
    const ok = searchParams.get("success")
    if (err) return { type: "error" as const, message: err }
    if (ok) return { type: "success" as const, message: `Conectado: ${ok}` }
    return null
  }, [searchParams])

  useEffect(() => {
    fetchConnectors()
  }, [])

  const fetchConnectors = async () => {
    try {
      setError(null)
      const res = await fetch("/api/connectors")
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "No se pudieron cargar los conectores")
      setConnectors(data.connectors)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (connector: Connector) => {
    setSaving(connector.type)
    try {
      const values = fieldValues[connector.type] ?? {}
      const res = await fetch(`/api/connectors/${connector.type}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Error al guardar")
      }
      await fetchConnectors()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error")
    } finally {
      setSaving(null)
    }
  }

  const handleCanvaConnect = async () => {
    try {
      const res = await fetch("/api/connectors/canva/connect")
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "OAuth no disponible")
      window.location.href = data.url
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error")
    }
  }

  const handleTest = async (connector: Connector) => {
    setTesting(connector.type)
    try {
      const payload =
        connector.guide?.testPayload ??
        (connector.capabilities.includes("video")
          ? { type: "video", script: "Test Postall" }
          : { type: "image", prompt: "Test Postall minimal photo" })

      const res = await fetch(`/api/connectors/${connector.type}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Generación fallida")

      if (data.status === "PENDING") {
        alert(
          `Video en cola (ID: ${data.externalId}). El cron poll-videos lo completará y aparecerá en Media.`
        )
      } else if (data.publicUrl || data.mediaAssetId) {
        alert("Generación correcta. Revisa Media Library.")
      } else {
        alert(JSON.stringify(data, null, 2))
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error")
    } finally {
      setTesting(null)
    }
  }

  const updateField = (connectorType: string, key: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [connectorType]: { ...(prev[connectorType] ?? {}), [key]: value },
    }))
  }

  const hasRequiredFields = (connector: Connector) => {
    const guide = connector.guide
    if (!guide) return false
    const values = fieldValues[connector.type] ?? {}
    const required = guide.fields.filter((f) => f.key === "apiKey" || f.key === "clientId")
    return required.every((f) => Boolean(values[f.key]?.trim()))
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Conectores creativos</h1>
        <p className="text-muted-foreground">
          Postall orquesta Canva, HeyGen e imagen con IA — no las reemplaza. Plan Agent requerido.
        </p>
      </div>

      {flash && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            flash.type === "error"
              ? "border-destructive/50 bg-destructive/10 text-destructive"
              : "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
          }`}
        >
          {flash.message}
        </div>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium">{error}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                El plan Agent incluye conectores.{" "}
                <Link href="/dashboard/billing" className="underline">
                  Ver planes
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {connectors.map((connector) => {
          const guide = connector.guide
          const isOAuth = guide?.authType === "oauth"

          return (
            <Card key={connector.type}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <PlugIcon className="h-5 w-5" />
                    {guide?.title ?? connector.name}
                  </CardTitle>
                  {connector.configured && (
                    <Badge variant="outline" className="shrink-0 text-green-600">
                      <CheckIcon className="mr-1 h-3 w-3" />
                      Conectado
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {guide?.description ?? connector.capabilities.join(" · ")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {guide && (
                  <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
                    {guide.steps.map((step) => (
                      <li key={step}>
                        {step.replace(
                          "{APP_URL}",
                          typeof window !== "undefined"
                            ? window.location.origin
                            : "https://app.postall.app"
                        )}
                      </li>
                    ))}
                  </ol>
                )}

                {guide?.docsUrl && (
                  <a
                    href={guide.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Documentación oficial
                    <ExternalLinkIcon className="h-3 w-3" />
                  </a>
                )}

                {guide?.fields.map((field) => (
                  <Field key={field.key}>
                    <FieldLabel htmlFor={`${connector.type}-${field.key}`}>
                      {field.label}
                    </FieldLabel>
                    <Input
                      id={`${connector.type}-${field.key}`}
                      type={field.type ?? "text"}
                      placeholder={field.placeholder}
                      value={fieldValues[connector.type]?.[field.key] ?? ""}
                      onChange={(e) =>
                        updateField(connector.type, field.key, e.target.value)
                      }
                    />
                  </Field>
                ))}

                {isOAuth ? (
                  <Button
                    className="w-full"
                    onClick={handleCanvaConnect}
                    disabled={connector.type !== "CANVA"}
                  >
                    Conectar con Canva
                  </Button>
                ) : null}

                <div className="flex gap-2">
                  {!isOAuth && (
                    <Button
                      size="sm"
                      onClick={() => handleSave(connector)}
                      disabled={saving === connector.type || !hasRequiredFields(connector)}
                    >
                      {saving === connector.type ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                      ) : (
                        "Guardar"
                      )}
                    </Button>
                  )}
                  {isOAuth && guide?.fields.length ? (
                    <Button
                      size="sm"
                      onClick={() => handleSave(connector)}
                      disabled={saving === connector.type || !hasRequiredFields(connector)}
                    >
                      {saving === connector.type ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                      ) : (
                        "Guardar app Canva"
                      )}
                    </Button>
                  ) : null}
                  {connector.configured && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTest(connector)}
                      disabled={testing === connector.type}
                    >
                      {testing === connector.type ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                      ) : (
                        "Probar"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
