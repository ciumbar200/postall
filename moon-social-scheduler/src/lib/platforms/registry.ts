import { Platform } from "@/lib/domain/enums"
import { instagramAdapter } from "@/lib/platforms/instagram"
import { tiktokAdapter } from "@/lib/platforms/tiktok"
import { linkedinAdapter } from "@/lib/platforms/linkedin"
import { facebookAdapter } from "@/lib/platforms/facebook"
import { youtubeAdapter } from "@/lib/platforms/youtube"
import { threadsAdapter } from "@/lib/platforms/threads"
import { blueskyAdapter } from "@/lib/platforms/bluesky"
import { telegramAdapter } from "@/lib/platforms/telegram"
import type { PlatformAdapter, PlatformSlug } from "@/lib/platforms/types"

const adapters = new Map<Platform, PlatformAdapter>([
  [Platform.INSTAGRAM, instagramAdapter],
  [Platform.TIKTOK, tiktokAdapter],
  [Platform.LINKEDIN, linkedinAdapter],
  [Platform.FACEBOOK, facebookAdapter],
  [Platform.YOUTUBE, youtubeAdapter],
  [Platform.THREADS, threadsAdapter],
  [Platform.BLUESKY, blueskyAdapter],
  [Platform.TELEGRAM, telegramAdapter],
])

const slugToPlatform = new Map<PlatformSlug, Platform>([
  ["instagram", Platform.INSTAGRAM],
  ["tiktok", Platform.TIKTOK],
  ["linkedin", Platform.LINKEDIN],
  ["facebook", Platform.FACEBOOK],
  ["youtube", Platform.YOUTUBE],
  ["threads", Platform.THREADS],
  ["bluesky", Platform.BLUESKY],
  ["telegram", Platform.TELEGRAM],
])

export const supportedPlatformSlugs = Array.from(slugToPlatform.keys())

export function platformFromSlug(slug: string): Platform | null {
  return slugToPlatform.get(slug as PlatformSlug) ?? null
}

export function getPlatformAdapter(platform: Platform): PlatformAdapter {
  const adapter = adapters.get(platform)

  if (!adapter) {
    throw new Error(`Platform ${platform} is not implemented yet.`)
  }

  return adapter
}

export function getPlatformAdapterBySlug(slug: string): PlatformAdapter {
  const platform = platformFromSlug(slug)

  if (!platform) {
    throw new Error(`Unknown platform slug: ${slug}`)
  }

  return getPlatformAdapter(platform)
}

export function listPlatformAdapters(): PlatformAdapter[] {
  return Array.from(adapters.values())
}
