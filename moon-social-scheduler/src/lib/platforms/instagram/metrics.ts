import { instagramClient } from "@/lib/platforms/instagram/client"
import type { PlatformAccount, PlatformMetric } from "@/lib/platforms/types"

type InstagramInsight = {
  name: string
  values?: Array<{ value?: number }>
}

type InstagramInsightsResponse = {
  data?: InstagramInsight[]
}

export async function fetchInstagramMetrics(
  account: PlatformAccount,
  externalPostId: string
): Promise<PlatformMetric[]> {
  const measuredAt = new Date()
  const response = await instagramClient.request<InstagramInsightsResponse>(
    `/${externalPostId}/insights`,
    {
      token: account.accessToken,
      searchParams: {
        metric: "views,reach,likes,comments,shares,saved",
      },
    }
  )

  return (response.data ?? []).map((item) => ({
    metric: item.name,
    value: Number(item.values?.[0]?.value ?? 0),
    measuredAt,
    metadata: { source: "instagram_insights" },
  }))
}
