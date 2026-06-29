"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { CheckIcon } from "lucide-react"
import { toast } from "sonner"
import { PLANS } from "@/lib/billing/plans"
import { PlanTier } from "@/lib/domain/enums"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

type Summary = {
  tier: PlanTier
  plan: {
    name: string
    priceLabel: string
    limits: {
      maxChannels: number
      maxPostsPerMonth: number | null
      apiAccess: boolean
    }
  }
  usage: { postsCreated: number; channels: number }
  subscription: {
    status: string
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    hasStripeCustomer: boolean
  } | null
  stripeEnabled: boolean
}

export function BillingOverview() {
  const [pending, setPending] = React.useState(false)

  const { data } = useQuery({
    queryKey: ["billing-summary"],
    queryFn: async () => {
      const response = await fetch("/api/billing/summary")
      if (!response.ok) throw new Error("Failed to load billing")
      return response.json() as Promise<Summary>
    },
    retry: false,
  })

  async function checkout(tier: PlanTier) {
    setPending(true)
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "No se pudo iniciar el pago")
      window.location.href = payload.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error")
      setPending(false)
    }
  }

  async function openPortal() {
    setPending(true)
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "No se pudo abrir el portal")
      window.location.href = payload.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error")
      setPending(false)
    }
  }

  const currentTier = data?.tier ?? PlanTier.FREE
  const postsLimit = data?.plan.limits.maxPostsPerMonth ?? null
  const postsUsed = data?.usage.postsCreated ?? 0

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Tu plan: {data?.plan.name ?? "Free"}
            {data?.subscription?.cancelAtPeriodEnd ? (
              <Badge variant="destructive">Cancela al final del periodo</Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            Facturación transparente, sin permanencia. Cancela cuando quieras desde cualquier
            dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Posts este mes</div>
              <div className="text-2xl font-semibold">
                {postsUsed}
                {postsLimit ? ` / ${postsLimit}` : " (ilimitado)"}
              </div>
              {postsLimit ? (
                <Progress className="mt-2" value={Math.min(100, (postsUsed / postsLimit) * 100)} />
              ) : null}
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Canales conectados</div>
              <div className="text-2xl font-semibold">
                {data?.usage.channels ?? 0} / {data?.plan.limits.maxChannels ?? 2}
              </div>
            </div>
          </div>
          {data?.subscription?.currentPeriodEnd ? (
            <p className="text-sm text-muted-foreground">
              Próxima renovación:{" "}
              {new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          ) : null}
          {data?.subscription?.hasStripeCustomer ? (
            <Button variant="outline" onClick={openPortal} disabled={pending}>
              Gestionar suscripción
            </Button>
          ) : null}
          {!data?.stripeEnabled ? (
            <p className="text-sm text-amber-500">
              Stripe aún no está configurado. Añade las claves para activar el cobro.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Precios honestos: 3 canales gratis de verdad (sin cobrarte al tercero), límites y
        uso siempre visibles, mensual sin permanencia y cancelación self-serve. Lo que otros
        venden como licencia de 1.199$ aquí entra en Agency por 39€/mes.
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.values(PLANS).map((plan) => {
          const isCurrent = plan.tier === currentTier
          return (
            <Card key={plan.tier} className={isCurrent ? "border-primary" : undefined}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrent ? <Badge>Actual</Badge> : null}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-semibold">{plan.priceLabel}</div>
                <ul className="space-y-2 text-sm">
                  {plan.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2">
                      <CheckIcon className="size-4 text-primary" />
                      {highlight}
                    </li>
                  ))}
                </ul>
                {plan.tier !== PlanTier.FREE && !isCurrent ? (
                  <Button
                    className="w-full"
                    onClick={() => checkout(plan.tier)}
                    disabled={pending || !data?.stripeEnabled}
                  >
                    Cambiar a {plan.name}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
