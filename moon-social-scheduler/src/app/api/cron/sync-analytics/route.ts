import { verifyCronSecret } from "@/lib/cron/verify-secret"
import { prisma } from "@/lib/db/client"
import { getPlatformAdapter } from "@/lib/platforms/registry"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    await verifyCronSecret(request)

    const targets = await prisma.postTarget.findMany({
      where: {
        status: "PUBLISHED",
        externalPostId: { not: null },
      },
      include: { socialAccount: true },
      take: 50,
      orderBy: { publishedAt: "desc" },
    })

    let synced = 0

    for (const target of targets) {
      if (!target.externalPostId) continue

      const adapter = getPlatformAdapter(target.platform)
      if (!adapter.metrics) continue

      try {
        const metrics = await adapter.metrics(
          {
            id: target.socialAccount.id,
            providerAccountId: target.socialAccount.providerAccountId,
            username: target.socialAccount.username,
            accessToken: target.socialAccount.accessToken,
            refreshToken: target.socialAccount.refreshToken,
            expiresAt: target.socialAccount.expiresAt,
            metadata: target.socialAccount.metadata as Record<string, unknown> | null,
          },
          target.externalPostId
        )

        for (const metric of metrics) {
          await prisma.analyticsMetric.create({
            data: {
              workspaceId: target.socialAccount.workspaceId,
              postTargetId: target.id,
              socialAccountId: target.socialAccount.id,
              platform: target.platform,
              metric: metric.metric,
              value: metric.value,
              measuredAt: metric.measuredAt ?? new Date(),
              metadata: metric.metadata as object | undefined,
            },
          })
          synced++
        }
      } catch (error) {
        console.error(`Analytics sync failed for target ${target.id}:`, error)
      }
    }

    return Response.json({ targets: targets.length, metricsSynced: synced })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 401 })
  }
}
