import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { getStripe, hasStripeEnv } from "@/lib/billing/stripe"
import { optionalEnv } from "@/lib/env"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!hasStripeEnv()) {
    return errorJson(new Error("Stripe no está configurado."), 503)
  }

  try {
    const { workspace } = await requireUserContext()
    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId: workspace.id },
    })

    if (!subscription?.stripeCustomerId) {
      return errorJson(new Error("No hay cliente de Stripe asociado a este workspace."), 400)
    }

    const stripe = getStripe()
    const base = optionalEnv("APP_URL", new URL(request.url).origin).replace(/\/$/, "")

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${base}/dashboard/billing`,
    })

    return json({ url: session.url })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    return errorJson(error)
  }
}
