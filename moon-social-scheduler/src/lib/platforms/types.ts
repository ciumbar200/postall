import type { Platform } from "@/lib/domain/enums"

export type PlatformSlug =
  | "instagram"
  | "tiktok"
  | "linkedin"
  | "facebook"
  | "youtube"
  | "threads"
  | "bluesky"
  | "telegram"

export type PlatformMedia = {
  id: string
  type: "IMAGE" | "GIF" | "VIDEO"
  mimeType: string
  byteSize: number
  publicUrl: string
  altText?: string | null
}

export type PlatformAccount = {
  id: string
  workspaceId?: string
  providerAccountId: string
  username: string
  accessToken: string
  refreshToken?: string | null
  expiresAt?: Date | null
  metadata?: Record<string, unknown> | null
}

export type PlatformAppCredentials = {
  clientId: string
  clientSecret: string
}

export type OAuthStartOptions = {
  state: string
  redirectUri: string
  appCredentials?: PlatformAppCredentials
}

export type OAuthExchangeInput = {
  code: string
  redirectUri: string
  verifier?: string | null
  appCredentials?: PlatformAppCredentials
}

export type ConnectedPlatformAccount = {
  providerAccountId: string
  username: string
  displayName?: string | null
  avatarUrl?: string | null
  accessToken: string
  refreshToken?: string | null
  tokenType?: string | null
  scope?: string | null
  expiresAt?: Date | null
  metadata?: Record<string, unknown> | null
}

export type PublishPostInput = {
  postId: string
  targetId: string
  account: PlatformAccount
  text: string
  media: PlatformMedia[]
  settings?: Record<string, unknown> | null
}

export type PublishPostResult = {
  externalPostId: string
  externalUrl?: string
  raw: Record<string, unknown>
}

export type PlatformMetric = {
  metric: string
  value: number
  measuredAt: Date
  metadata?: Record<string, unknown>
}

export type TokenRefreshResult = {
  accessToken: string
  refreshToken?: string | null
  expiresAt?: Date | null
  scope?: string | null
  metadata?: Record<string, unknown> | null
}

export type PublishCommentInput = {
  account: PlatformAccount
  externalPostId: string
  text: string
}

export type PlatformAdapter = {
  platform: Platform
  slug: PlatformSlug
  name: string
  color: string
  characterLimit: number
  scopes: string[]
  /** Whether the platform supports an automatic first comment after publishing. */
  supportsFirstComment?: boolean
  auth: {
    getAuthorizationUrl(options: OAuthStartOptions): URL
    exchangeCode(input: OAuthExchangeInput): Promise<ConnectedPlatformAccount>
  }
  format: {
    validate(input: PublishPostInput): void
    toApiPayload(input: PublishPostInput): Record<string, unknown>
  }
  publish(input: PublishPostInput): Promise<PublishPostResult>
  metrics(account: PlatformAccount, externalPostId: string): Promise<PlatformMetric[]>
  /**
   * Optional proactive token refresh. Adapters that support refresh tokens
   * implement this so the scheduled cron can renew access before expiry.
   */
  refresh?(account: PlatformAccount): Promise<TokenRefreshResult>
  /**
   * Optional automatic first comment posted right after the main post.
   * Implemented by platforms that support native comments (IG, FB, LinkedIn, Threads...).
   */
  publishComment?(input: PublishCommentInput): Promise<void>
}
