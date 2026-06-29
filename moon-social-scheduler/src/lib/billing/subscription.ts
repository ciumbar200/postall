import { PlanTier } from "@/lib/domain/enums"
import { prisma } from "@/lib/db/client"
import { isMissingTableError } from "@/lib/db/errors"
import { getPlan, UNLIMITED, type PlanLimits } from "@/lib/billing/plans"

export async function getWorkspaceTier(workspaceId: string): Promise<PlanTier> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId },
    })

    if (!subscription) return PlanTier.FREE

    if (subscription.status === "ACTIVE" || subscription.status === "TRIALING") {
      return subscription.tier as PlanTier
    }

    return PlanTier.FREE
  } catch (error) {
    if (isMissingTableError(error, "Subscription")) {
      return PlanTier.FREE
    }
    throw error
  }
}

export async function getWorkspaceLimits(workspaceId: string): Promise<PlanLimits> {
  const tier = await getWorkspaceTier(workspaceId)
  return getPlan(tier).limits
}

function currentPeriodStart(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

export async function getMonthlyUsage(workspaceId: string) {
  const periodStart = currentPeriodStart()
  try {
    const counter = await prisma.usageCounter.findUnique({
      where: { workspaceId_periodStart: { workspaceId, periodStart } },
    })
    return {
      periodStart,
      postsCreated: counter?.postsCreated ?? 0,
      apiCalls: counter?.apiCalls ?? 0,
    }
  } catch (error) {
    if (isMissingTableError(error, "UsageCounter")) {
      return { periodStart, postsCreated: 0, apiCalls: 0 }
    }
    throw error
  }
}

export async function incrementUsage(
  workspaceId: string,
  field: "postsCreated" | "apiCalls",
  by = 1
) {
  const periodStart = currentPeriodStart()
  await prisma.usageCounter.upsert({
    where: { workspaceId_periodStart: { workspaceId, periodStart } },
    update: { [field]: { increment: by } },
    create: { workspaceId, periodStart, [field]: by },
  })
}

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PlanLimitError"
  }
}

export async function assertCanCreatePost(workspaceId: string) {
  const limits = await getWorkspaceLimits(workspaceId)
  if (limits.maxPostsPerMonth === UNLIMITED) return

  const usage = await getMonthlyUsage(workspaceId)
  if (usage.postsCreated >= limits.maxPostsPerMonth) {
    throw new PlanLimitError(
      `Has alcanzado el límite de ${limits.maxPostsPerMonth} posts/mes de tu plan. Mejora tu plan para seguir publicando.`
    )
  }
}

export async function assertCanConnectChannel(workspaceId: string) {
  const limits = await getWorkspaceLimits(workspaceId)
  if (limits.maxChannels === UNLIMITED) return

  const connected = await prisma.socialAccount.count({
    where: { workspaceId, status: { in: ["CONNECTED", "EXPIRED", "ERROR"] } },
  })

  if (connected >= limits.maxChannels) {
    throw new PlanLimitError(
      `Tu plan permite ${limits.maxChannels} canales. Mejora tu plan para conectar más.`
    )
  }
}

export async function assertApiAccess(workspaceId: string) {
  const limits = await getWorkspaceLimits(workspaceId)
  if (!limits.apiAccess) {
    throw new PlanLimitError("Tu plan no incluye acceso a la API. Mejora al plan Agent.")
  }
}

type BooleanFeature = {
  [K in keyof PlanLimits]: PlanLimits[K] extends boolean ? K : never
}[keyof PlanLimits]

export async function hasFeature(
  workspaceId: string,
  feature: BooleanFeature
): Promise<boolean> {
  if (process.env.DEV_SKIP_DATABASE === "1") {
    return getPlan(PlanTier.AGENCY).limits[feature] as boolean
  }
  const limits = await getWorkspaceLimits(workspaceId)
  return Boolean(limits[feature])
}

const FEATURE_UPGRADE_HINT: Record<BooleanFeature, string> = {
  apiAccess: "Mejora al plan Agent para usar la API.",
  mcpAccess: "Mejora al plan Agent para usar el servidor MCP.",
  analytics: "Mejora al plan Creator para ver analítica avanzada.",
  approvals: "Mejora al plan Creator para activar el flujo de aprobaciones.",
  webhooks: "Mejora al plan Agent para recibir webhooks.",
  firstComment: "Mejora al plan Creator para el primer comentario automático.",
  labels: "Esta función no está disponible en tu plan.",
  whiteLabel: "El white-label está disponible en el plan Agency.",
  reselling: "La gestión de clientes está disponible en el plan Agency.",
  brandAgent: "El Agente de Marca está disponible en el plan Agent.",
  connectors: "Los conectores creativos están disponibles en el plan Agent.",
  customIntegrations: "Las credenciales personalizadas están disponibles en el plan Agency.",
}

export async function assertFeature(workspaceId: string, feature: BooleanFeature) {
  if (process.env.DEV_SKIP_DATABASE === "1") {
    return
  }
  if (!(await hasFeature(workspaceId, feature))) {
    throw new PlanLimitError(FEATURE_UPGRADE_HINT[feature])
  }
}
