"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BuildingIcon, PaletteIcon, PlusIcon } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

type Branding = {
  brandName: string | null
  logoUrl: string | null
  primaryColor: string | null
  customDomain: string | null
  supportEmail: string | null
  hidePostallBranding: boolean
}

type Client = {
  id: string
  name: string
  slug: string
  channels: number
  posts: number
  members: number
}

export function AgencyOverview() {
  const queryClient = useQueryClient()

  const branding = useQuery({
    queryKey: ["branding"],
    queryFn: async () => {
      const response = await fetch("/api/branding")
      if (!response.ok) throw new Error("No se pudo cargar el branding")
      return response.json() as Promise<{ enabled: boolean; branding: Branding | null }>
    },
    retry: false,
  })

  const clients = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await fetch("/api/clients")
      if (!response.ok) throw new Error("No se pudieron cargar los clientes")
      return response.json() as Promise<{ clients: Client[] }>
    },
    retry: false,
  })

  const enabled = branding.data?.enabled ?? false

  const [form, setForm] = React.useState<Branding>({
    brandName: "",
    logoUrl: "",
    primaryColor: "#6366f1",
    customDomain: "",
    supportEmail: "",
    hidePostallBranding: false,
  })

  React.useEffect(() => {
    if (branding.data?.branding) {
      setForm({
        brandName: branding.data.branding.brandName ?? "",
        logoUrl: branding.data.branding.logoUrl ?? "",
        primaryColor: branding.data.branding.primaryColor ?? "#6366f1",
        customDomain: branding.data.branding.customDomain ?? "",
        supportEmail: branding.data.branding.supportEmail ?? "",
        hidePostallBranding: branding.data.branding.hidePostallBranding,
      })
    }
  }, [branding.data])

  const saveBranding = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Error guardando")
      return payload
    },
    onSuccess: () => {
      toast.success("Branding guardado")
      queryClient.invalidateQueries({ queryKey: ["branding"] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Error"),
  })

  const [clientName, setClientName] = React.useState("")
  const createClient = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clientName }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Error creando cliente")
      return payload
    },
    onSuccess: () => {
      setClientName("")
      toast.success("Cliente creado")
      queryClient.invalidateQueries({ queryKey: ["clients"] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Error"),
  })

  return (
    <div className="flex flex-col gap-6">
      {!enabled ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>White-label y gestión de clientes</CardTitle>
            <CardDescription>
              Disponible en el plan Agency (39€/mes). Lanza tu propio SaaS con tu marca, gestiona
              workspaces de clientes y revende Postall. La competencia cobra esto como licencia de
              1.199$.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<a href="/dashboard/billing" />}>Ver plan Agency</Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PaletteIcon className="size-4" />
            White-label
          </CardTitle>
          <CardDescription>Tu marca en todo el producto y emails.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="brandName">Nombre de marca</FieldLabel>
              <Input
                id="brandName"
                value={form.brandName ?? ""}
                disabled={!enabled}
                onChange={(e) => setForm((f) => ({ ...f, brandName: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="logoUrl">URL del logo</FieldLabel>
              <Input
                id="logoUrl"
                value={form.logoUrl ?? ""}
                disabled={!enabled}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="customDomain">Dominio propio</FieldLabel>
              <Input
                id="customDomain"
                placeholder="social.tuagencia.com"
                value={form.customDomain ?? ""}
                disabled={!enabled}
                onChange={(e) => setForm((f) => ({ ...f, customDomain: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="supportEmail">Email de soporte</FieldLabel>
              <Input
                id="supportEmail"
                value={form.supportEmail ?? ""}
                disabled={!enabled}
                onChange={(e) => setForm((f) => ({ ...f, supportEmail: e.target.value }))}
              />
            </Field>
          </div>
          <Field orientation="horizontal">
            <FieldLabel>Ocultar marca Postall</FieldLabel>
            <Switch
              checked={form.hidePostallBranding}
              disabled={!enabled}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, hidePostallBranding: checked }))
              }
            />
          </Field>
          <Button onClick={() => saveBranding.mutate()} disabled={!enabled || saveBranding.isPending}>
            Guardar branding
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BuildingIcon className="size-4" />
            Clientes
          </CardTitle>
          <CardDescription>
            Cada cliente es un workspace aislado que gestionas desde tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <Field className="flex-1">
              <FieldLabel htmlFor="clientName">Nombre del cliente</FieldLabel>
              <Input
                id="clientName"
                value={clientName}
                disabled={!enabled}
                onChange={(e) => setClientName(e.target.value)}
              />
            </Field>
            <Button
              onClick={() => createClient.mutate()}
              disabled={!enabled || !clientName || createClient.isPending}
            >
              <PlusIcon data-icon="inline-start" />
              Crear cliente
            </Button>
          </div>

          {clients.data?.clients.length ? (
            <ul className="divide-y">
              {clients.data.clients.map((client) => (
                <li key={client.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{client.name}</div>
                    <div className="text-xs text-muted-foreground">{client.slug}</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{client.channels} canales</Badge>
                    <Badge variant="secondary">{client.posts} posts</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aún no tienes clientes.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
