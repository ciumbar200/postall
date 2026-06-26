import { optionalEnv, requiredEnv } from "@/lib/env"
import { tiktokClient } from "@/lib/platforms/tiktok/client"
import type {
  ConnectedPlatformAccount,
  OAuthExchangeInput,
  OAuthStartOptions,
} from "@/lib/platforms/types"

export const tiktokScopes = ["user.info.basic", "video.publish", "video.upload"]

type TikTokTokenResponse = {
  open_id: string
  scope: string
  access_token: string
  expires_in: number
  refresh_token?: string
  refresh_expires_in?: number
  token_type?: string
  error?: string
  error_description?: string
}

type TikTokUserInfoResponse = {
  data?: {
    user?: {
      open_id: string
      union_id?: string
      avatar_url?: string
      display_name?: string
      username?: string
    }
  }
  error?: {
    code: string
    message: string
    log_id?: string
  }
}

export function getTikTokAuthorizationUrl({
  state,
  redirectUri,
}: OAuthStartOptions): URL {
  const url = new URL(
    optionalEnv(
      "TIKTOK_AUTHORIZATION_URL",
      "https://www.tiktok.com/v2/auth/authorize/"
    )
  )

  url.searchParams.set("client_key", requiredEnv("TIKTOK_CLIENT_KEY"))
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", tiktokScopes.join(","))
  url.searchParams.set("state", state)

  return url
}

export async function exchangeTikTokCode({
  code,
  redirectUri,
}: OAuthExchangeInput): Promise<ConnectedPlatformAccount> {
  const body = new URLSearchParams({
    client_key: requiredEnv("TIKTOK_CLIENT_KEY"),
    client_secret: requiredEnv("TIKTOK_CLIENT_SECRET"),
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  })

  const response = await fetch(
    optionalEnv(
      "TIKTOK_TOKEN_URL",
      "https://open.tiktokapis.com/v2/oauth/token/"
    ),
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  )

  const token = (await response.json()) as TikTokTokenResponse

  if (!response.ok || !token.access_token) {
    throw new Error(`TikTok authorization failed: ${JSON.stringify(token)}`)
  }

  const profile = await tiktokClient.request<TikTokUserInfoResponse>(
    "/v2/user/info/",
    {
      token: token.access_token,
      searchParams: {
        fields: "open_id,union_id,avatar_url,display_name,username",
      },
    }
  )

  const user = profile.data?.user
  const username = user?.username || user?.display_name || token.open_id

  return {
    providerAccountId: user?.open_id ?? token.open_id,
    username,
    displayName: user?.display_name ?? username,
    avatarUrl: user?.avatar_url,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    tokenType: token.token_type ?? "Bearer",
    scope: token.scope,
    expiresAt: new Date(Date.now() + token.expires_in * 1000),
    metadata: {
      openId: token.open_id,
      unionId: user?.union_id,
      refreshExpiresIn: token.refresh_expires_in,
    },
  }
}
