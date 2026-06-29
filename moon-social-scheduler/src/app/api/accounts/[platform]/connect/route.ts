import { randomUUID } from "node:crypto"
import { Platform } from "@/lib/domain/enums"
import { errorJson } from "@/lib/api/response"
import { requireUserContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { isDatabaseConfigured } from "@/lib/db/runtime"
import { connectPlatform } from "@/lib/local-dev/store"
import { getPlatformAdapterBySlug, platformFromSlug } from "@/lib/platforms/registry"
import { resolvePlatformAppCredentials } from "@/lib/integrations/resolve"
import type { PlatformSlug } from "@/lib/platforms/types"
import { assertCanConnectChannel, PlanLimitError } from "@/lib/billing/subscription"
import { optionalEnv } from "@/lib/env"

const demoPlatformMap = {
  instagram: Platform.INSTAGRAM,
  tiktok: Platform.TIKTOK,
  linkedin: Platform.LINKEDIN,
  facebook: Platform.FACEBOOK,
  youtube: Platform.YOUTUBE,
} as const

function redirectUriFor(request: Request, platform: string) {
  const base = optionalEnv("APP_URL", new URL(request.url).origin).replace(/\/$/, "")
  return `${base}/api/accounts/${platform}/callback`
}

export async function GET(
  request: Request,
  context: RouteContext<"/api/accounts/[platform]/connect">
) {
  const { platform } = await context.params

  if (isDatabaseConfigured()) {
    try {
      const { user, workspace } = await requireUserContext()
      await assertCanConnectChannel(workspace.id)

      const mapped = platformFromSlug(platform)
      const adapter = getPlatformAdapterBySlug(platform)
      if (!mapped) throw new Error("Unsupported platform")

      const appCredentials = await resolvePlatformAppCredentials(
        workspace.id,
        platform as PlatformSlug
      )
      if (!appCredentials) {
        return Response.redirect(
          new URL(`/dashboard/accounts?setup=${platform}`, request.url),
          302
        )
      }

      const state = randomUUID()
      const redirectUri = redirectUriFor(request, platform)
      const authUrl = adapter.auth.getAuthorizationUrl({
        state,
        redirectUri,
        appCredentials,
      })

      await prisma.oAuthState.create({
        data: {
          state,
          platform: mapped,
          userId: user.id,
          workspaceId: workspace.id,
          redirectTo: "/dashboard/accounts",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      })

      return Response.redirect(authUrl.toString(), 302)
    } catch (error) {
      if (error instanceof PlanLimitError) {
        return Response.redirect(
          new URL(`/dashboard/billing?error=channel_limit`, request.url),
          302
        )
      }
    }
  }

  const demo = demoPlatformMap[platform as keyof typeof demoPlatformMap]
  if (!demo) {
    return errorJson(new Error("Unsupported platform."), 400)
  }
  connectPlatform(demo)
  return Response.redirect(
    new URL(`/dashboard/accounts?connected=${platform}`, request.url),
    302
  )
}
