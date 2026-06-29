import type Stripe from "stripe"
import { errorJson, json } from "@/lib/api/response"
import { prisma } from "@/lib/db/client"
import { getStripe, hasStripeEnv } from "@/lib/billing/stripe"
import { planForPriceId } from "@/lib/billing/plans"

export const runtime = "nodejs"

function mapStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
      return "ACTIVE"
    case "trialing":
      return "TRIALING"
    case "past_due":
    case "unpaid":
      return "PAST_DUE"
    case "canceled":
      return "CANCELED"
    default:
      return "INCOMPLETE"
  }
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const workspaceId =
    (subscription.metadata?.workspaceId as string | undefined) ?? undefined
  const priceId = subscription.items.data[0]?.price?.id ?? null
  const tier = planForPriceId(priceId)
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id
  const periodEndUnix = (subscription as unknown as { current_period_end?: number })
    .current_period_end

  const data = {
    tier: tier as never,
    status: mapStatus(subscription.status) as never,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    currentPeriodEnd: periodEndUnix ? new Date(periodEndUnix * 1000) : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
  }

  const existing = workspaceId
    ? await prisma.subscription.findUnique({ where: { workspaceId } })
    : await prisma.subscription.findFirst({
        where: { stripeCustomerId: customerId },
      })

  if (existing) {
    await prisma.subscription.update({ where: { id: existing.id }, data })
  } else if (workspaceId) {
    await prisma.subscription.create({ data: { workspaceId, ...data } })
  }
}

export async function POST(request: Request) {
  if (!hasStripeEnv() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return errorJson(new Error("Stripe webhook no configurado."), 503)
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return errorJson(new Error("Falta la firma de Stripe."), 400)
  }

  const stripe = getStripe()
  const body = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    return errorJson(error, 400)
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id
          const subscription = await stripe.subscriptions.retrieve(subId)
          if (session.metadata?.workspaceId && !subscription.metadata?.workspaceId) {
            subscription.metadata = {
              ...subscription.metadata,
              workspaceId: session.metadata.workspaceId,
            }
          }
          await syncSubscription(subscription)
        }
        break
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription)
        break
      }
      default:
        break
    }

    return json({ received: true })
  } catch (error) {
    return errorJson(error)
  }
}
