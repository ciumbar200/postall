import { Platform } from "@/lib/domain/enums"
import { genericFormat } from "@/lib/platforms/shared/format"
import type {
  PlatformAdapter,
  PublishPostInput,
  PublishPostResult,
} from "@/lib/platforms/types"

function pdsBase(input: PublishPostInput) {
  return (input.account.metadata?.pds as string) ?? "https://bsky.social"
}

async function createSession(pds: string, identifier: string, password: string) {
  const response = await fetch(`${pds}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  })
  const data = (await response.json().catch(() => ({}))) as {
    accessJwt?: string
    did?: string
    error?: string
    message?: string
  }
  if (!response.ok || !data.accessJwt) {
    throw new Error(`Bluesky auth failed: ${data.message ?? data.error ?? "unknown"}`)
  }
  return data
}

async function publishBluesky(input: PublishPostInput): Promise<PublishPostResult> {
  const pds = pdsBase(input)
  // username = handle, accessToken = app password.
  const session = await createSession(pds, input.account.username, input.account.accessToken)

  const record = {
    $type: "app.bsky.feed.post",
    text: input.text.slice(0, 300),
    createdAt: new Date().toISOString(),
  }

  const response = await fetch(`${pds}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessJwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repo: session.did,
      collection: "app.bsky.feed.post",
      record,
    }),
  })
  const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) {
    throw new Error(`Bluesky publish failed: ${JSON.stringify(raw)}`)
  }

  const uri = raw.uri as string | undefined
  return { externalPostId: uri ?? "", raw }
}

export const blueskyAdapter: PlatformAdapter = {
  platform: Platform.BLUESKY,
  slug: "bluesky",
  name: "Bluesky",
  color: "#0085ff",
  characterLimit: 300,
  scopes: [],
  auth: {
    getAuthorizationUrl: () => {
      throw new Error(
        "Bluesky se conecta con tu handle y una App Password desde Ajustes, no por OAuth."
      )
    },
    exchangeCode: async () => {
      throw new Error("Bluesky no usa OAuth.")
    },
  },
  format: genericFormat(Platform.BLUESKY),
  publish: publishBluesky,
  metrics: async () => [],
}
