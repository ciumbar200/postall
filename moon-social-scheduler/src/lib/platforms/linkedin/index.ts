import { Platform } from "@/lib/domain/enums"
import { genericFormat } from "@/lib/platforms/shared/format"
import {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  tokenToAccount,
  type OAuth2Config,
} from "@/lib/platforms/shared/oauth2"
import type {
  PlatformAdapter,
  PublishPostInput,
  PublishPostResult,
} from "@/lib/platforms/types"

const config: OAuth2Config = {
  authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
  tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
  clientIdEnv: "LINKEDIN_CLIENT_ID",
  clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
  scopes: ["openid", "profile", "w_member_social"],
}

async function publishLinkedIn(input: PublishPostInput): Promise<PublishPostResult> {
  const authorUrn =
    (input.account.metadata?.authorUrn as string | undefined) ??
    `urn:li:person:${input.account.providerAccountId}`

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.account.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: input.text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  })

  const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) {
    throw new Error(`LinkedIn publish failed: ${JSON.stringify(raw)}`)
  }
  const id = (raw.id as string) ?? ""
  return { externalPostId: id, raw }
}

export const linkedinAdapter: PlatformAdapter = {
  platform: Platform.LINKEDIN,
  slug: "linkedin",
  name: "LinkedIn",
  color: "#0a66c2",
  characterLimit: 3000,
  scopes: config.scopes,
  auth: {
    getAuthorizationUrl: (options) => buildAuthorizationUrl(config, options),
    exchangeCode: async (input) => {
      const token = await exchangeAuthorizationCode(config, input)
      const profile = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${token.access_token}` },
      })
        .then((response) => response.json())
        .catch(() => ({}))
      return tokenToAccount(token, {
        providerAccountId: (profile.sub as string) ?? "me",
        username: (profile.name as string) ?? "linkedin",
        displayName: profile.name as string,
        avatarUrl: profile.picture as string,
      })
    },
  },
  format: genericFormat(Platform.LINKEDIN),
  publish: publishLinkedIn,
  metrics: async () => [],
}
