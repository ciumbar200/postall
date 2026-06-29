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

const GRAPH = "https://graph.threads.net/v1.0"

const config: OAuth2Config = {
  authorizeUrl: "https://threads.net/oauth/authorize",
  tokenUrl: "https://graph.threads.net/oauth/access_token",
  clientIdEnv: "THREADS_CLIENT_ID",
  clientSecretEnv: "THREADS_CLIENT_SECRET",
  scopes: ["threads_basic", "threads_content_publish"],
  scopeSeparator: ",",
}

async function publishThreads(input: PublishPostInput): Promise<PublishPostResult> {
  const userId = (input.account.metadata?.threadsUserId as string) ?? input.account.providerAccountId
  const image = input.media.find((media) => media.type === "IMAGE")
  const video = input.media.find((media) => media.type === "VIDEO")

  const createParams = new URLSearchParams({
    access_token: input.account.accessToken,
    text: input.text,
    media_type: video ? "VIDEO" : image ? "IMAGE" : "TEXT",
  })
  if (image) createParams.set("image_url", image.publicUrl)
  if (video) createParams.set("video_url", video.publicUrl)

  const createResponse = await fetch(`${GRAPH}/${userId}/threads`, {
    method: "POST",
    body: createParams,
  })
  const created = (await createResponse.json().catch(() => ({}))) as Record<string, unknown>
  if (!createResponse.ok || !created.id) {
    throw new Error(`Threads container creation failed: ${JSON.stringify(created)}`)
  }

  const publishResponse = await fetch(`${GRAPH}/${userId}/threads_publish`, {
    method: "POST",
    body: new URLSearchParams({
      access_token: input.account.accessToken,
      creation_id: created.id as string,
    }),
  })
  const published = (await publishResponse.json().catch(() => ({}))) as Record<string, unknown>
  if (!publishResponse.ok) {
    throw new Error(`Threads publish failed: ${JSON.stringify(published)}`)
  }

  return { externalPostId: (published.id as string) ?? "", raw: published }
}

export const threadsAdapter: PlatformAdapter = {
  platform: Platform.THREADS,
  slug: "threads",
  name: "Threads",
  color: "#000000",
  characterLimit: 500,
  scopes: config.scopes,
  auth: {
    getAuthorizationUrl: (options) => buildAuthorizationUrl(config, options),
    exchangeCode: async (input) => {
      const token = await exchangeAuthorizationCode(config, input)
      const profile = await fetch(
        `${GRAPH}/me?fields=id,username&access_token=${token.access_token}`
      )
        .then((response) => response.json())
        .catch(() => ({}))
      return tokenToAccount(token, {
        providerAccountId: (profile.id as string) ?? "me",
        username: (profile.username as string) ?? "threads",
        displayName: profile.username as string,
      })
    },
  },
  format: genericFormat(Platform.THREADS),
  publish: publishThreads,
  metrics: async () => [],
}
