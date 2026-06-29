import { errorJson } from "@/lib/api/response"
import { prisma } from "@/lib/db/client"
import { isDatabaseConfigured } from "@/lib/db/runtime"
import { getPlatformAdapterBySlug, platformFromSlug } from "@/lib/platforms/registry"
import { resolvePlatformAppCredentials } from "@/lib/integrations/resolve"
import type { PlatformSlug } from "@/lib/platforms/types"
import { assertCanConnectChannel, PlanLimitError } from "@/lib/billing/subscription"
import { optionalEnv } from "@/lib/env"

function redirectUriFor(request: Request, platform: string) {
  const base = optionalEnv("APP_URL", new URL(request.url).origin).replace(/\/$/, "")
  return `${base}/api/accounts/${platform}/callback`
}

export async function GET(
  request: Request,
  context: RouteContext<"/api/accounts/[platform]/callback">
) {
  const { platform } = await context.params
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")

  if (!isDatabaseConfigured() || !code || !state) {
    return Response.redirect(
      new URL(`/dashboard/accounts?connected=${platform}`, request.url),
      302
    )
  }

  try {
    const mapped = platformFromSlug(platform)
    if (!mapped) throw new Error("Unsupported platform")

    const oauthState = await prisma.oAuthState.findUnique({ where: { state } })
    if (!oauthState || oauthState.platform !== mapped || oauthState.expiresAt < new Date()) {
      throw new Error("Invalid or expired OAuth state")
    }

    await assertCanConnectChannel(oauthState.workspaceId)

    const adapter = getPlatformAdapterBySlug(platform)
    const appCredentials = await resolvePlatformAppCredentials(
      oauthState.workspaceId,
      platform as PlatformSlug
    )
    if (!appCredentials) {
      throw new Error("Platform credentials are not configured")
    }

    const connected = await adapter.auth.exchangeCode({
      code,
      redirectUri: redirectUriFor(request, platform),
      verifier: oauthState.verifier,
      appCredentials,
    })

    await prisma.socialAccount.upsert({
      where: {
        workspaceId_platform_providerAccountId: {
          workspaceId: oauthState.workspaceId,
          platform: mapped,
          providerAccountId: connected.providerAccountId,
        },
      },
      update: {
        username: connected.username,
        displayName: connected.displayName ?? null,
        avatarUrl: connected.avatarUrl ?? null,
        status: "CONNECTED",
        accessToken: connected.accessToken,
        refreshToken: connected.refreshToken ?? null,
        tokenType: connected.tokenType ?? null,
        scope: connected.scope ?? null,
        expiresAt: connected.expiresAt ?? null,
        metadata: (connected.metadata ?? undefined) as never,
        disconnectedAt: null,
        lastSyncedAt: new Date(),
      },
      create: {
        workspaceId: oauthState.workspaceId,
        platform: mapped,
        providerAccountId: connected.providerAccountId,
        username: connected.username,
        displayName: connected.displayName ?? null,
        avatarUrl: connected.avatarUrl ?? null,
        status: "CONNECTED",
        accessToken: connected.accessToken,
        refreshToken: connected.refreshToken ?? null,
        tokenType: connected.tokenType ?? null,
        scope: connected.scope ?? null,
        expiresAt: connected.expiresAt ?? null,
        metadata: (connected.metadata ?? undefined) as never,
        lastSyncedAt: new Date(),
      },
    })

    await prisma.oAuthState.delete({ where: { state } }).catch(() => undefined)

    return Response.redirect(
      new URL(`/dashboard/accounts?connected=${platform}`, request.url),
      302
    )
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return Response.redirect(new URL(`/dashboard/billing?error=channel_limit`, request.url), 302)
    }
    return errorJson(error)
  }
}
