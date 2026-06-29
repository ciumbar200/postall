import { optionalEnv } from "@/lib/env"
import type { PlatformAccount, TokenRefreshResult } from "@/lib/platforms/types"

type InstagramRefreshResponse = {
  access_token?: string
  token_type?: string
  expires_in?: number
  error?: { message?: string; type?: string; code?: number }
}

/**
 * Instagram long-lived tokens last ~60 days and can be refreshed before expiry
 * with the ig_refresh_token grant. Refreshing only works on tokens at least 24h old.
 */
export async function refreshInstagramToken(
  account: PlatformAccount
): Promise<TokenRefreshResult> {
  const base = optionalEnv("INSTAGRAM_GRAPH_URL", "https://graph.instagram.com")
  const url = new URL(`${base}/refresh_access_token`)
  url.searchParams.set("grant_type", "ig_refresh_token")
  url.searchParams.set("access_token", account.accessToken)

  const response = await fetch(url, { headers: { Accept: "application/json" } })
  const token = (await response.json()) as InstagramRefreshResponse

  if (!response.ok || !token.access_token) {
    throw new Error(`Instagram token refresh failed: ${JSON.stringify(token)}`)
  }

  return {
    accessToken: token.access_token,
    refreshToken: account.refreshToken ?? null,
    expiresAt: token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000)
      : null,
  }
}
