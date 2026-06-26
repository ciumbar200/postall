import { Platform } from "@/generated/prisma/enums"
import {
  exchangeInstagramCode,
  getInstagramAuthorizationUrl,
  instagramScopes,
} from "@/lib/platforms/instagram/auth"
import {
  toInstagramContainerPayload,
  validateInstagramPost,
} from "@/lib/platforms/instagram/formatter"
import { fetchInstagramMetrics } from "@/lib/platforms/instagram/metrics"
import { publishInstagramPost } from "@/lib/platforms/instagram/publish"
import type { PlatformAdapter } from "@/lib/platforms/types"

export const instagramAdapter: PlatformAdapter = {
  platform: Platform.INSTAGRAM,
  slug: "instagram",
  name: "Instagram",
  color: "#e4405f",
  characterLimit: 2200,
  scopes: instagramScopes,
  auth: {
    getAuthorizationUrl: getInstagramAuthorizationUrl,
    exchangeCode: exchangeInstagramCode,
  },
  format: {
    validate: validateInstagramPost,
    toApiPayload: toInstagramContainerPayload,
  },
  publish: publishInstagramPost,
  metrics: fetchInstagramMetrics,
}
