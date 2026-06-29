// ponytail: conector Fliki para video
import { ConnectorType } from "@/generated/prisma/enums"
import type {
  ContentConnector,
  GenerateVideoInput,
  ConnectorResult
} from "../types"
import { getCredential } from "../credentials"

class FlikiConnector implements ContentConnector {
  type = ConnectorType.FLIKI as const
  name = "Fliki Video"
  capabilities = ["video"] as const

  async isConfigured(workspaceId: string): Promise<boolean> {
    const cred = await getCredential(workspaceId, this.type)
    return !!cred?.apiKey
  }

  async generateVideo(
    input: GenerateVideoInput,
    cred: { apiKey?: string }
  ): Promise<ConnectorResult> {
    if (!cred?.apiKey) throw new Error("Fliki API key required")

    // ponytail: Fliki API endpoints - adjust to actual API
    const response = await fetch("https://api.fliki.ai/v1/videos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cred.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        script: input.script,
        ...(input.voiceId && { voice_id: input.voiceId }),
        aspect_ratio: input.aspectRatio || "16:9"
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Fliki error: ${error}`)
    }

    const data = await response.json() as { id?: string; status?: string }
    const videoId = data.id

    if (!videoId) throw new Error("No video ID returned")

    // ponytail: async - return externalId for polling
    return { externalId: videoId, assets: [] }
  }

  async pollStatus(
    externalId: string,
    cred: { apiKey?: string }
  ): Promise<ConnectorResult> {
    if (!cred?.apiKey) throw new Error("Fliki API key required")

    const response = await fetch(`https://api.fliki.ai/v1/videos/${externalId}`, {
      headers: { Authorization: `Bearer ${cred.apiKey}` }
    })

    if (!response.ok) throw new Error("Fliki status check failed")

    const data = await response.json() as { status?: string; output_url?: string }

    if (data.status === "ready" && data.output_url) {
      return {
        assets: [{ url: data.output_url, mime: "video/mp4", filename: `fliki-${externalId}.mp4` }]
      }
    }

    if (data.status === "failed") {
      throw new Error("Fliki video generation failed")
    }

    // still processing
    return { externalId, assets: [] }
  }
}

export const flikiConnector = new FlikiConnector()
