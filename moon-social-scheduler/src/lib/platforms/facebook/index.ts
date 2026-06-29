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
  PublishCommentInput,
  PublishPostInput,
  PublishPostResult,
} from "@/lib/platforms/types"

const GRAPH = "https://graph.facebook.com/v21.0"

const config: OAuth2Config = {
  authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
  tokenUrl: `${GRAPH}/oauth/access_token`,
  clientIdEnv: "FACEBOOK_CLIENT_ID",
  clientSecretEnv: "FACEBOOK_CLIENT_SECRET",
  scopes: ["pages_manage_posts", "pages_read_engagement"],
  scopeSeparator: ",",
}

async function publishFacebook(input: PublishPostInput): Promise<PublishPostResult> {
  const pageId = input.account.metadata?.pageId as string | undefined
  if (!pageId) {
    throw new Error("Facebook account is missing pageId metadata.")
  }

  const image = input.media.find((media) => media.type === "IMAGE")
  const endpoint = image ? `${GRAPH}/${pageId}/photos` : `${GRAPH}/${pageId}/feed`
  const body = new URLSearchParams({ access_token: input.account.accessToken })
  if (image) {
    body.set("url", image.publicUrl)
    body.set("caption", input.text)
  } else {
    body.set("message", input.text)
  }

  const response = await fetch(endpoint, { method: "POST", body })
  const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) {
    throw new Error(`Facebook publish failed: ${JSON.stringify(raw)}`)
  }
  return {
    externalPostId: (raw.post_id as string) ?? (raw.id as string) ?? "",
    raw,
  }
}

async function publishFacebookComment(input: PublishCommentInput): Promise<void> {
  const body = new URLSearchParams({
    access_token: input.account.accessToken,
    message: input.text,
  })
  const response = await fetch(`${GRAPH}/${input.externalPostId}/comments`, {
    method: "POST",
    body,
  })
  if (!response.ok) {
    const raw = await response.text().catch(() => "")
    throw new Error(`Facebook comment failed: ${raw}`)
  }
}

export const facebookAdapter: PlatformAdapter = {
  platform: Platform.FACEBOOK,
  slug: "facebook",
  name: "Facebook",
  color: "#1877f2",
  characterLimit: 63206,
  scopes: config.scopes,
  supportsFirstComment: true,
  auth: {
    getAuthorizationUrl: (options) => buildAuthorizationUrl(config, options),
    exchangeCode: async (input) => {
      const token = await exchangeAuthorizationCode(config, input)
      const profile = await fetch(`${GRAPH}/me?access_token=${token.access_token}`)
        .then((response) => response.json())
        .catch(() => ({}))
      return tokenToAccount(token, {
        providerAccountId: (profile.id as string) ?? "me",
        username: (profile.name as string) ?? "facebook",
        displayName: profile.name as string,
      })
    },
  },
  format: genericFormat(Platform.FACEBOOK),
  publish: publishFacebook,
  metrics: async () => [],
  publishComment: publishFacebookComment,
}
