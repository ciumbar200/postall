import type { PlatformSlug } from "@/lib/platforms/types"
import {
  credentialsFromEnv,
  hasHostedPlatformCredentials,
  platformEnvSpecs,
} from "@/lib/integrations/platform-specs"
import {
  hasPlatformAppCredentials,
  resolvePlatformAppCredentials,
} from "@/lib/integrations/resolve"

export function hasPlatformCredentials(slug: PlatformSlug): boolean {
  return hasHostedPlatformCredentials(slug)
}

export function missingPlatformEnvVars(slug: PlatformSlug): string[] {
  const spec = platformEnvSpecs[slug]
  if (!spec) return []
  return [spec.clientIdEnv, spec.clientSecretEnv].filter((key) => !process.env[key]?.trim())
}

export async function hasPlatformCredentialsForWorkspace(
  workspaceId: string,
  slug: PlatformSlug
): Promise<boolean> {
  return hasPlatformAppCredentials(workspaceId, slug)
}

export async function resolveCredentialsForWorkspace(
  workspaceId: string,
  slug: PlatformSlug
) {
  return resolvePlatformAppCredentials(workspaceId, slug)
}

export function redirectUriForPlatform(slug: PlatformSlug, appUrl: string): string {
  const base = appUrl.replace(/\/$/, "")
  return `${base}/api/accounts/${slug}/callback`
}

export { credentialsFromEnv }
