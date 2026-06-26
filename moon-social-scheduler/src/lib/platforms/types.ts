import type { Platform } from "@/generated/prisma/enums"

export type PlatformSlug = "instagram" | "tiktok"

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
  providerAccountId: string
  username: string
  accessToken: string
  refreshToken?: string | null
  expiresAt?: Date | null
  metadata?: Record<string, unknown> | null
}

export type OAuthStartOptions = {
  state: string
  redirectUri: string
}

export type OAuthExchangeInput = {
  code: string
  redirectUri: string
  verifier?: string | null
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

export type PlatformAdapter = {
  platform: Platform
  slug: PlatformSlug
  name: string
  color: string
  characterLimit: number
  scopes: string[]
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
}
