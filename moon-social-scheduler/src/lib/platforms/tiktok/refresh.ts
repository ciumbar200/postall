import { optionalEnv } from "@/lib/env"
import { resolvePlatformAppCredentials } from "@/lib/integrations/resolve"
import { resolveTikTokCredentials } from "@/lib/platforms/tiktok/auth"
import type { PlatformAccount, TokenRefreshResult } from "@/lib/platforms/types"

type TikTokRefreshResponse = {
  access_token?: string
  expires_in?: number
  refresh_token?: string
  refresh_expires_in?: number
  scope?: string
  open_id?: string
  error?: string
  error_description?: string
}

export async function refreshTikTokToken(
  account: PlatformAccount
): Promise<TokenRefreshResult> {
  if (!account.refreshToken) {
    throw new Error("TikTok account has no refresh token")
  }

  let credentials
  if (account.workspaceId) {
    const resolved = await resolvePlatformAppCredentials(account.workspaceId, "tiktok")
    if (resolved) {
      credentials = {
        clientId: resolved.clientId,
        clientSecret: resolved.clientSecret,
      }
    }
  }
  credentials ??= resolveTikTokCredentials()

  const body = new URLSearchParams({
    client_key: credentials.clientId,
    client_secret: credentials.clientSecret,
    grant_type: "refresh_token",
    refresh_token: account.refreshToken,
  })

  const response = await fetch(
    optionalEnv("TIKTOK_TOKEN_URL", "https://open.tiktokapis.com/v2/oauth/token/"),
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  )

  const token = (await response.json()) as TikTokRefreshResponse

  if (!response.ok || !token.access_token) {
    throw new Error(`TikTok token refresh failed: ${JSON.stringify(token)}`)
  }

  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? account.refreshToken,
    expiresAt: token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000)
      : null,
    scope: token.scope ?? null,
    metadata: {
      refreshExpiresIn: token.refresh_expires_in,
      openId: token.open_id,
    },
  }
}
