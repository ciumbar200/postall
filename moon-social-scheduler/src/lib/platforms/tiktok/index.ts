import { Platform } from "@/lib/domain/enums"
import {
  exchangeTikTokCode,
  getTikTokAuthorizationUrl,
  tiktokScopes,
} from "@/lib/platforms/tiktok/auth"
import {
  toTikTokPayload,
  validateTikTokPost,
} from "@/lib/platforms/tiktok/formatter"
import { fetchTikTokMetrics } from "@/lib/platforms/tiktok/metrics"
import { publishTikTokPost } from "@/lib/platforms/tiktok/publish"
import { refreshTikTokToken } from "@/lib/platforms/tiktok/refresh"
import type { PlatformAdapter } from "@/lib/platforms/types"

export const tiktokAdapter: PlatformAdapter = {
  platform: Platform.TIKTOK,
  slug: "tiktok",
  name: "TikTok",
  color: "#00f2ea",
  characterLimit: 2200,
  scopes: tiktokScopes,
  auth: {
    getAuthorizationUrl: getTikTokAuthorizationUrl,
    exchangeCode: exchangeTikTokCode,
  },
  format: {
    validate: validateTikTokPost,
    toApiPayload: toTikTokPayload,
  },
  publish: publishTikTokPost,
  metrics: fetchTikTokMetrics,
  refresh: refreshTikTokToken,
}
