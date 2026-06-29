// ponytail: conector de generación de imágenes via OpenAI DALL-E
import { ConnectorType } from "@/generated/prisma/enums"
import type {
  ContentConnector,
  GenerateImageInput,
  ConnectorResult,
  ConnectorAsset
} from "../types"
import { getCredential } from "../credentials"

class ImageGenConnector implements ContentConnector {
  type = ConnectorType.IMAGE_GEN as const
  name = "Image Generation (OpenAI)"
  capabilities = ["image"] as const

  async isConfigured(workspaceId: string): Promise<boolean> {
    const cred = await getCredential(workspaceId, this.type)
    return !!cred?.apiKey
  }

  async generateImage(
    input: GenerateImageInput,
    cred: { apiKey?: string }
  ): Promise<ConnectorResult> {
    if (!cred?.apiKey) throw new Error("OpenAI API key required")

    const model = process.env.OPENAI_IMAGE_MODEL || "dall-e-3"
    const size = this.sizeFromAspectRatio(input.aspectRatio)

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cred.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        prompt: input.prompt,
        n: input.n || 1,
        size,
        response_format: "b64_json"
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI image gen error: ${error}`)
    }

    const data = await response.json() as {
      data?: Array<{ b64_json?: string; url?: string }>
    }

    const assets: ConnectorAsset[] = (data.data || []).map(item => ({
      buffer: item.b64_json ? Buffer.from(item.b64_json, "base64").buffer : undefined,
      url: item.url,
      mime: "image/png",
      filename: `generated-${Date.now()}.png`
    }))

    return { assets }
  }

  private sizeFromAspectRatio(ratio?: string): string {
    switch (ratio) {
      case "16:9": return "1792x1024"
      case "9:16": return "1024x1792"
      case "4:5": return "1024x1280"
      case "1:1": default: return "1024x1024"
    }
  }
}

export const imageGenConnector = new ImageGenConnector()
