import { optionalEnv, requiredEnv } from "@/lib/env"
import { instagramClient } from "@/lib/platforms/instagram/client"
import type {
  ConnectedPlatformAccount,
  OAuthExchangeInput,
  OAuthStartOptions,
} from "@/lib/platforms/types"

type ShortLivedTokenResponse = {
  access_token: string
  user_id: number | string
  permissions?: string[]
}

type InstagramProfileResponse = {
  id: string
  username: string
  account_type?: string
  profile_picture_url?: string
}

export const instagramScopes = [
  "instagram_business_basic",
  "instagram_business_content_publish",
]

export function getInstagramAuthorizationUrl({
  state,
  redirectUri,
}: OAuthStartOptions): URL {
  const url = new URL(
    optionalEnv(
      "INSTAGRAM_AUTHORIZATION_URL",
      "https://www.instagram.com/oauth/authorize"
    )
  )

  url.searchParams.set("client_id", requiredEnv("INSTAGRAM_APP_ID"))
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", instagramScopes.join(","))
  url.searchParams.set("state", state)

  return url
}

export async function exchangeInstagramCode({
  code,
  redirectUri,
}: OAuthExchangeInput): Promise<ConnectedPlatformAccount> {
  const body = new URLSearchParams({
    client_id: requiredEnv("INSTAGRAM_APP_ID"),
    client_secret: requiredEnv("INSTAGRAM_APP_SECRET"),
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  })

  const response = await fetch(
    optionalEnv(
      "INSTAGRAM_TOKEN_URL",
      "https://api.instagram.com/oauth/access_token"
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

  const shortLived = (await response.json()) as ShortLivedTokenResponse & {
    error_message?: string
  }

  if (!response.ok || !shortLived.access_token) {
    throw new Error(
      `Instagram authorization failed: ${JSON.stringify(shortLived)}`
    )
  }

  const longLived = await instagramClient.exchangeShortLivedToken(
    shortLived.access_token
  )

  const profile = await instagramClient.request<InstagramProfileResponse>("/me", {
    token: longLived.access_token,
    searchParams: {
      fields: "id,username,account_type,profile_picture_url",
    },
  })

  const expiresAt = longLived.expires_in
    ? new Date(Date.now() + longLived.expires_in * 1000)
    : undefined

  return {
    providerAccountId: profile.id || String(shortLived.user_id),
    username: profile.username,
    displayName: profile.username,
    avatarUrl: profile.profile_picture_url,
    accessToken: longLived.access_token,
    tokenType: longLived.token_type ?? "Bearer",
    scope: instagramScopes.join(","),
    expiresAt,
    metadata: {
      accountType: profile.account_type,
      permissions: shortLived.permissions ?? [],
    },
  }
}
