import { Platform } from "@/generated/prisma/enums"
import { instagramAdapter } from "@/lib/platforms/instagram"
import { tiktokAdapter } from "@/lib/platforms/tiktok"
import type { PlatformAdapter, PlatformSlug } from "@/lib/platforms/types"

const adapters = new Map<Platform, PlatformAdapter>([
  [Platform.INSTAGRAM, instagramAdapter],
  [Platform.TIKTOK, tiktokAdapter],
])

const slugToPlatform = new Map<PlatformSlug, Platform>([
  ["instagram", Platform.INSTAGRAM],
  ["tiktok", Platform.TIKTOK],
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
