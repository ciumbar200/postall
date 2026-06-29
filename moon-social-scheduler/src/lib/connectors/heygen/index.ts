import { ConnectorType } from "@/generated/prisma/enums"
import type {
  ContentConnector,
  GenerateVideoInput,
  ConnectorResult,
} from "../types"
import { getCredential } from "../credentials"
import { optionalEnv } from "@/lib/env"

class HeyGenConnector implements ContentConnector {
  type = ConnectorType.HEYGEN as const
  name = "HeyGen Video"
  capabilities = ["video"] as const

  async isConfigured(workspaceId: string): Promise<boolean> {
    const cred = await getCredential(workspaceId, this.type)
    return !!cred?.apiKey
  }

  async generateVideo(
    input: GenerateVideoInput,
    cred: { apiKey?: string }
  ): Promise<ConnectorResult> {
    if (!cred?.apiKey) throw new Error("HeyGen API key required")

    const avatarId =
      input.avatarId || optionalEnv("HEYGEN_DEFAULT_AVATAR_ID", "")
    const voiceId = input.voiceId || optionalEnv("HEYGEN_DEFAULT_VOICE_ID", "")

    const videoInput: Record<string, unknown> = {
      voice: {
        type: "text",
        input_text: input.script,
        ...(voiceId ? { voice_id: voiceId } : {}),
      },
    }

    if (avatarId) {
      videoInput.character = {
        type: "avatar",
        avatar_id: avatarId,
        avatar_style: "normal",
      }
    }

    const dimension =
      input.aspectRatio === "9:16"
        ? { width: 1080, height: 1920 }
        : { width: 1920, height: 1080 }

    const response = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: {
        "X-Api-Key": cred.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_inputs: [videoInput],
        dimension,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HeyGen error: ${error}`)
    }

    const data = (await response.json()) as {
      data?: { video_id?: string }
      error?: unknown
    }
    const videoId = data.data?.video_id

    if (!videoId) throw new Error("No video ID returned from HeyGen")

    return { externalId: videoId, assets: [] }
  }

  async pollStatus(
    externalId: string,
    cred: { apiKey?: string }
  ): Promise<ConnectorResult> {
    if (!cred?.apiKey) throw new Error("HeyGen API key required")

    const response = await fetch(
      `https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(externalId)}`,
      { headers: { "X-Api-Key": cred.apiKey } }
    )

    if (!response.ok) throw new Error("HeyGen status check failed")

    const data = (await response.json()) as {
      data?: { status?: string; video_url?: string }
    }

    const status = data.data?.status
    const url = data.data?.video_url

    if (status === "completed" && url) {
      return {
        assets: [
          { url, mime: "video/mp4", filename: `heygen-${externalId}.mp4` },
        ],
      }
    }

    if (status === "failed") {
      throw new Error("HeyGen video generation failed")
    }

    return { externalId, assets: [] }
  }
}

export const heygenConnector = new HeyGenConnector()
