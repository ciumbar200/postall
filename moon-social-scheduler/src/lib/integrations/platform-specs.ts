import { Platform } from "@/lib/domain/enums"
import type { PlatformSlug } from "@/lib/platforms/types"

export type PlatformAppCredentialPayload = {
  clientId: string
  clientSecret: string
  extras?: Record<string, string>
}

export type CredentialSource = "workspace" | "hosted" | "missing"

export type ResolvedPlatformAppCredentials = PlatformAppCredentialPayload & {
  source: CredentialSource
}

const slugToPlatform: Record<PlatformSlug, Platform> = {
  instagram: Platform.INSTAGRAM,
  tiktok: Platform.TIKTOK,
  linkedin: Platform.LINKEDIN,
  facebook: Platform.FACEBOOK,
  youtube: Platform.YOUTUBE,
  threads: Platform.THREADS,
  bluesky: Platform.BLUESKY,
  telegram: Platform.TELEGRAM,
}

export const platformEnvSpecs: Record<
  PlatformSlug,
  { clientIdEnv: string; clientSecretEnv: string } | null
> = {
  instagram: { clientIdEnv: "INSTAGRAM_APP_ID", clientSecretEnv: "INSTAGRAM_APP_SECRET" },
  tiktok: { clientIdEnv: "TIKTOK_CLIENT_KEY", clientSecretEnv: "TIKTOK_CLIENT_SECRET" },
  linkedin: { clientIdEnv: "LINKEDIN_CLIENT_ID", clientSecretEnv: "LINKEDIN_CLIENT_SECRET" },
  facebook: { clientIdEnv: "FACEBOOK_CLIENT_ID", clientSecretEnv: "FACEBOOK_CLIENT_SECRET" },
  youtube: { clientIdEnv: "YOUTUBE_CLIENT_ID", clientSecretEnv: "YOUTUBE_CLIENT_SECRET" },
  threads: { clientIdEnv: "THREADS_CLIENT_ID", clientSecretEnv: "THREADS_CLIENT_SECRET" },
  bluesky: null,
  telegram: null,
}

export function platformFromSlug(slug: PlatformSlug): Platform {
  return slugToPlatform[slug]
}

export function credentialsFromEnv(slug: PlatformSlug): PlatformAppCredentialPayload | null {
  const spec = platformEnvSpecs[slug]
  if (!spec) return null
  const clientId = process.env[spec.clientIdEnv]?.trim()
  const clientSecret = process.env[spec.clientSecretEnv]?.trim()
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

export function hasHostedPlatformCredentials(slug: PlatformSlug): boolean {
  return credentialsFromEnv(slug) !== null
}
