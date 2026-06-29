import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { hasFeature } from "@/lib/billing/subscription"
import { optionalEnv } from "@/lib/env"
import { supportedPlatformSlugs } from "@/lib/platforms/registry"
import {
  hasPlatformCredentialsForWorkspace,
  redirectUriForPlatform,
} from "@/lib/platforms/credentials"
import { getPlatformCredentialSource } from "@/lib/integrations/resolve"
import { platformSetupGuides } from "@/lib/platforms/setup-guides"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireUserContext()
    const appUrl = optionalEnv("APP_URL", new URL(request.url).origin)
    const canUseCustomCredentials = await hasFeature(
      workspaceId,
      "customIntegrations"
    )

    const platforms = await Promise.all(
      supportedPlatformSlugs.map(async (slug) => {
        const guide = platformSetupGuides[slug]
        const configured = await hasPlatformCredentialsForWorkspace(workspaceId, slug)
        const credentialSource = await getPlatformCredentialSource(workspaceId, slug)

        return {
          slug,
          name: guide.name,
          authType: guide.authType,
          configured,
          credentialSource,
          canUseCustomCredentials,
          redirectUri:
            guide.authType === "oauth" ? redirectUriForPlatform(slug, appUrl) : null,
          summary: guide.summary,
          devConsoleLinks: guide.devConsoleLinks,
          fieldLabels: guide.fieldLabels,
          steps: guide.steps,
          notes: guide.notes,
          requiresAppReview: guide.requiresAppReview ?? false,
        }
      })
    )

    return json({ appUrl, platforms })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    return errorJson(error)
  }
}
