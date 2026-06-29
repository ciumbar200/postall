import { Platform } from "@/lib/domain/enums"
import { genericFormat } from "@/lib/platforms/shared/format"
import type {
  PlatformAdapter,
  PublishPostInput,
  PublishPostResult,
} from "@/lib/platforms/types"

async function publishTelegram(input: PublishPostInput): Promise<PublishPostResult> {
  const botToken = input.account.accessToken
  const chatId = input.account.metadata?.chatId as string | undefined
  if (!chatId) {
    throw new Error("Telegram account is missing chatId metadata.")
  }

  const image = input.media.find((media) => media.type === "IMAGE")
  const base = `https://api.telegram.org/bot${botToken}`

  const endpoint = image ? `${base}/sendPhoto` : `${base}/sendMessage`
  const payload: Record<string, unknown> = image
    ? { chat_id: chatId, photo: image.publicUrl, caption: input.text }
    : { chat_id: chatId, text: input.text }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const raw = (await response.json().catch(() => ({}))) as {
    ok?: boolean
    result?: { message_id?: number }
    description?: string
  }
  if (!response.ok || !raw.ok) {
    throw new Error(`Telegram publish failed: ${raw.description ?? "unknown error"}`)
  }

  return {
    externalPostId: String(raw.result?.message_id ?? ""),
    raw: raw as Record<string, unknown>,
  }
}

export const telegramAdapter: PlatformAdapter = {
  platform: Platform.TELEGRAM,
  slug: "telegram",
  name: "Telegram",
  color: "#26a5e4",
  characterLimit: 4096,
  scopes: [],
  auth: {
    getAuthorizationUrl: () => {
      throw new Error(
        "Telegram se conecta con un Bot Token y chat_id desde Ajustes, no por OAuth."
      )
    },
    exchangeCode: async () => {
      throw new Error("Telegram no usa OAuth.")
    },
  },
  format: genericFormat(Platform.TELEGRAM),
  publish: publishTelegram,
  metrics: async () => [],
}
