import { prisma } from "@/lib/db/client"
import { generateStructured, z } from "@/lib/ai/provider"
import { buildBrandAgentSystem } from "./prompts"
import { getBrandProfile } from "./brand-agent"
import type { BrandContext } from "@/lib/connectors/types"

const RevisionSchema = z.object({
  insights: z.array(z.string()),
  recommendedChanges: z.array(
    z.object({
      action: z.string(),
      platform: z.string().optional(),
      format: z.string().optional(),
      rationale: z.string(),
    })
  ),
  revisedPlanDiff: z.array(
    z.object({
      weekNumber: z.number().int(),
      change: z.string(),
      priority: z.enum(["high", "medium", "low"]),
    })
  ),
})

export async function reviseContentStrategy(params: {
  workspaceId: string
  lookbackDays?: number
}) {
  const lookbackDays = params.lookbackDays ?? 28
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  const metrics = await prisma.analyticsMetric.groupBy({
    by: ["platform", "metric"],
    where: {
      workspaceId: params.workspaceId,
      measuredAt: { gte: since },
    },
    _sum: { value: true },
    _count: { _all: true },
  })

  const recentRuns = await prisma.agentRun.findMany({
    where: { workspaceId: params.workspaceId, status: "DRAFTED" },
    orderBy: { createdAt: "desc" },
    take: 3,
  })

  const brandProfile = await getBrandProfile(params.workspaceId)
  const brandContext: BrandContext | undefined = brandProfile
    ? {
        voice: brandProfile.voice || undefined,
        tone: brandProfile.tone || undefined,
        audience: brandProfile.audience || undefined,
        keywords: brandProfile.keywords,
        bannedWords: brandProfile.bannedWords,
      }
    : undefined

  const metricsSummary =
    metrics.length > 0
      ? metrics
          .map(
            (row) =>
              `${row.platform} ${row.metric}: ${row._sum.value ?? 0} (${row._count._all} samples)`
          )
          .join("\n")
      : "Sin métricas reales aún — usa benchmarks típicos por plataforma y recomienda experimentos A/B."

  const planSummary = recentRuns
    .map((run) => {
      const plan = run.planJson as { rationale?: string; pieces?: unknown[] } | null
      return `Run ${run.id.slice(0, 8)}: ${plan?.rationale ?? run.brief} (${plan?.pieces?.length ?? 0} piezas)`
    })
    .join("\n")

  const revision = await generateStructured({
    schema: RevisionSchema,
    system: buildBrandAgentSystem(brandContext),
    prompt: `Analiza el rendimiento del contenido y propone ajustes de estrategia para las próximas semanas.

Métricas (${lookbackDays} días):
${metricsSummary}

Campañas recientes:
${planSummary || "Ninguna campaña previa"}

Devuelve insights accionables, cambios recomendados por plataforma/formato, y un diff de plan por semana.`,
    workspaceId: params.workspaceId,
  })

  return {
    lookbackDays,
    metricsCount: metrics.length,
    revision,
  }
}
