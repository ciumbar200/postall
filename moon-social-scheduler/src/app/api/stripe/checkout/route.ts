import { z } from "zod"
import { PlanTier } from "@/lib/domain/enums"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { getStripe, hasStripeEnv } from "@/lib/billing/stripe"
import { priceIdForTier } from "@/lib/billing/plans"
import { optionalEnv } from "@/lib/env"

export const runtime = "nodejs"

const schema = z.object({
  tier: z.enum([PlanTier.CREATOR, PlanTier.AGENT, PlanTier.AGENCY]),
})

export async function POST(request: Request) {
  if (!hasStripeEnv()) {
    return errorJson(new Error("Stripe no está configurado."), 503)
  }

  try {
    const { user, workspace } = await requireUserContext()
    const { tier } = schema.parse(await request.json())

    const priceId = priceIdForTier(tier)
    if (!priceId) {
      return errorJson(new Error(`No hay precio configurado para el plan ${tier}.`), 400)
    }

    const stripe = getStripe()
    const base = optionalEnv("APP_URL", new URL(request.url).origin).replace(/\/$/, "")

    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId: workspace.id },
    })

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: subscription?.stripeCustomerId ?? undefined,
      customer_email: subscription?.stripeCustomerId ? undefined : user.email,
      client_reference_id: workspace.id,
      subscription_data: {
        metadata: { workspaceId: workspace.id, tier },
      },
      metadata: { workspaceId: workspace.id, tier },
      success_url: `${base}/dashboard/billing?status=success`,
      cancel_url: `${base}/dashboard/billing?status=cancelled`,
      allow_promotion_codes: true,
    })

    return json({ url: session.url })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    return errorJson(error)
  }
}
