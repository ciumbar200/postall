import { requiredEnv } from "@/lib/env"
import type {
  ConnectedPlatformAccount,
  OAuthExchangeInput,
  OAuthStartOptions,
  PlatformAppCredentials,
} from "@/lib/platforms/types"

export type OAuth2Config = {
  authorizeUrl: string
  tokenUrl: string
  clientIdEnv: string
  clientSecretEnv: string
  scopes: string[]
  scopeSeparator?: string
  extraAuthParams?: Record<string, string>
}

function resolveCredentials(
  config: OAuth2Config,
  appCredentials?: PlatformAppCredentials
): PlatformAppCredentials {
  if (appCredentials?.clientId && appCredentials?.clientSecret) {
    return appCredentials
  }
  return {
    clientId: requiredEnv(config.clientIdEnv),
    clientSecret: requiredEnv(config.clientSecretEnv),
  }
}

export function buildAuthorizationUrl(
  config: OAuth2Config,
  { state, redirectUri, appCredentials }: OAuthStartOptions
): URL {
  const credentials = resolveCredentials(config, appCredentials)
  const url = new URL(config.authorizeUrl)
  url.searchParams.set("client_id", credentials.clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", config.scopes.join(config.scopeSeparator ?? " "))
  url.searchParams.set("state", state)
  for (const [key, value] of Object.entries(config.extraAuthParams ?? {})) {
    url.searchParams.set(key, value)
  }
  return url
}

type TokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
  error?: string
  error_description?: string
}

export async function exchangeAuthorizationCode(
  config: OAuth2Config,
  { code, redirectUri, appCredentials }: OAuthExchangeInput
): Promise<TokenResponse> {
  const credentials = resolveCredentials(config, appCredentials)
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
  })

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  const token = (await response.json()) as TokenResponse
  if (!response.ok || !token.access_token) {
    throw new Error(`OAuth token exchange failed: ${JSON.stringify(token)}`)
  }
  return token
}

export function tokenToAccount(
  token: TokenResponse,
  profile: { providerAccountId: string; username: string; displayName?: string; avatarUrl?: string }
): ConnectedPlatformAccount {
  return {
    providerAccountId: profile.providerAccountId,
    username: profile.username,
    displayName: profile.displayName ?? profile.username,
    avatarUrl: profile.avatarUrl,
    accessToken: token.access_token as string,
    refreshToken: token.refresh_token,
    tokenType: token.token_type ?? "Bearer",
    scope: token.scope,
    expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
  }
}

export { resolveCredentials as resolveOAuth2Credentials }
