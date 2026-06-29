import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { getPlan, PLANS, PLAN_ORDER } from "@/lib/billing/plans"
import { getMonthlyUsage, getWorkspaceTier } from "@/lib/billing/subscription"
import { hasStripeEnv } from "@/lib/billing/stripe"

export const runtime = "nodejs"

function serializeLimit(value: number): number | null {
  return value === Number.POSITIVE_INFINITY ? null : value
}

export async function GET() {
  try {
    const { workspace } = await requireUserContext()
    const tier = await getWorkspaceTier(workspace.id)
    const plan = getPlan(tier)
    const usage = await getMonthlyUsage(workspace.id)

    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId: workspace.id },
    })

    const channels = await prisma.socialAccount.count({
      where: { workspaceId: workspace.id, status: { in: ["CONNECTED", "EXPIRED", "ERROR"] } },
    })

    return json({
      tier,
      plan: {
        name: plan.name,
        priceLabel: plan.priceLabel,
        limits: {
          maxChannels: plan.limits.maxChannels,
          maxPostsPerMonth:
            plan.limits.maxPostsPerMonth === Number.POSITIVE_INFINITY
              ? null
              : plan.limits.maxPostsPerMonth,
          apiAccess: plan.limits.apiAccess,
          mcpAccess: plan.limits.mcpAccess,
          analytics: plan.limits.analytics,
        },
      },
      usage: {
        postsCreated: usage.postsCreated,
        channels,
      },
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            hasStripeCustomer: Boolean(subscription.stripeCustomerId),
          }
        : null,
      availablePlans: PLAN_ORDER.map((t) => {
        const p = PLANS[t]
        return {
          tier: p.tier,
          name: p.name,
          priceLabel: p.priceLabel,
          monthlyPriceEur: p.monthlyPriceEur,
          description: p.description,
          highlights: p.highlights,
          current: t === tier,
          limits: {
            maxChannels: serializeLimit(p.limits.maxChannels),
            maxPostsPerMonth: serializeLimit(p.limits.maxPostsPerMonth),
            teamMembers: serializeLimit(p.limits.teamMembers),
            apiAccess: p.limits.apiAccess,
            mcpAccess: p.limits.mcpAccess,
            webhooks: p.limits.webhooks,
            analytics: p.limits.analytics,
            approvals: p.limits.approvals,
            firstComment: p.limits.firstComment,
            labels: p.limits.labels,
            whiteLabel: p.limits.whiteLabel,
            reselling: p.limits.reselling,
            customIntegrations: p.limits.customIntegrations,
          },
        }
      }),
      stripeEnabled: hasStripeEnv(),
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    return errorJson(error)
  }
}
