import { Platform } from "@/lib/domain/enums"
import { genericFormat } from "@/lib/platforms/shared/format"
import {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  tokenToAccount,
  type OAuth2Config,
} from "@/lib/platforms/shared/oauth2"
import type {
  PlatformAccount,
  PlatformAdapter,
  PublishPostInput,
  PublishPostResult,
  TokenRefreshResult,
} from "@/lib/platforms/types"
import { resolvePlatformAppCredentials } from "@/lib/integrations/resolve"
import { resolveOAuth2Credentials } from "@/lib/platforms/shared/oauth2"

const config: OAuth2Config = {
  authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  clientIdEnv: "YOUTUBE_CLIENT_ID",
  clientSecretEnv: "YOUTUBE_CLIENT_SECRET",
  scopes: [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
  ],
  extraAuthParams: { access_type: "offline", prompt: "consent" },
}

async function refreshYouTube(account: PlatformAccount): Promise<TokenRefreshResult> {
  if (!account.refreshToken) {
    throw new Error("YouTube account has no refresh token")
  }

  let credentials
  if (account.workspaceId) {
    const resolved = await resolvePlatformAppCredentials(account.workspaceId, "youtube")
    if (resolved) {
      credentials = {
        clientId: resolved.clientId,
        clientSecret: resolved.clientSecret,
      }
    }
  }
  credentials ??= resolveOAuth2Credentials(config)

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: account.refreshToken,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
  })
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  const token = (await response.json()) as {
    access_token?: string
    expires_in?: number
    scope?: string
  }
  if (!response.ok || !token.access_token) {
    throw new Error(`YouTube token refresh failed: ${JSON.stringify(token)}`)
  }
  return {
    accessToken: token.access_token,
    refreshToken: account.refreshToken,
    expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
    scope: token.scope ?? null,
  }
}

async function publishYouTube(input: PublishPostInput): Promise<PublishPostResult> {
  const video = input.media.find((media) => media.type === "VIDEO")
  if (!video) {
    throw new Error("YouTube requires a video asset.")
  }

  // Download the source, then upload via resumable/multipart videos.insert.
  const source = await fetch(video.publicUrl)
  if (!source.ok) {
    throw new Error("Could not fetch the source video for YouTube upload.")
  }
  const videoBlob = await source.blob()

  const metadata = {
    snippet: {
      title: input.text.slice(0, 95) || "Video",
      description: input.text,
    },
    status: { privacyStatus: (input.settings?.privacyStatus as string) ?? "private" },
  }

  const form = new FormData()
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  )
  form.append("video", videoBlob)

  const response = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${input.account.accessToken}` },
      body: form,
    }
  )
  const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) {
    throw new Error(`YouTube upload failed: ${JSON.stringify(raw)}`)
  }
  const id = raw.id as string
  return {
    externalPostId: id ?? "",
    externalUrl: id ? `https://youtu.be/${id}` : undefined,
    raw,
  }
}

export const youtubeAdapter: PlatformAdapter = {
  platform: Platform.YOUTUBE,
  slug: "youtube",
  name: "YouTube",
  color: "#ff0000",
  characterLimit: 5000,
  scopes: config.scopes,
  auth: {
    getAuthorizationUrl: (options) => buildAuthorizationUrl(config, options),
    exchangeCode: async (input) => {
      const token = await exchangeAuthorizationCode(config, input)
      const profile = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        { headers: { Authorization: `Bearer ${token.access_token}` } }
      )
        .then((response) => response.json())
        .catch(() => ({}))
      const channel = profile.items?.[0]
      return tokenToAccount(token, {
        providerAccountId: channel?.id ?? "me",
        username: channel?.snippet?.title ?? "youtube",
        displayName: channel?.snippet?.title,
        avatarUrl: channel?.snippet?.thumbnails?.default?.url,
      })
    },
  },
  format: genericFormat(Platform.YOUTUBE),
  publish: publishYouTube,
  metrics: async () => [],
  refresh: refreshYouTube,
}
