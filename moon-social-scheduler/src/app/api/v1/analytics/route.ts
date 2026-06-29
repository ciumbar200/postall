import { json } from "@/lib/api/response"
import { withApiKey } from "@/lib/api/v1"
import { prisma } from "@/lib/db/client"

export const runtime = "nodejs"

export const GET = withApiKey("analytics:read", async (_request, context) => {
  const grouped = await prisma.analyticsMetric.groupBy({
    by: ["platform", "metric"],
    where: { workspaceId: context.workspaceId },
    _sum: { value: true },
  })

  return json({
    metrics: grouped.map((row) => ({
      platform: row.platform,
      metric: row.metric,
      value: row._sum.value ?? 0,
    })),
  })
})
