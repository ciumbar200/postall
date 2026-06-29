// ponytail: conector Canva con OAuth + Autofill + Export
import { ConnectorType } from "@/generated/prisma/enums"
import { resolveCanvaAppCredentials } from "@/lib/integrations/resolve"
import { optionalEnv } from "@/lib/env"
import type { ContentConnector, DesignInput, ConnectorResult } from "../types"
import { getCredential } from "../credentials"

function canvaRedirectUri() {
  return (
    process.env.CANVA_REDIRECT_URI ||
    `${optionalEnv("NEXT_PUBLIC_APP_URL", optionalEnv("APP_URL", "http://localhost:3000"))}/api/connectors/canva/callback`
  )
}

class CanvaConnector implements ContentConnector {
  type = ConnectorType.CANVA
  name = "Canva"
  capabilities: ("image" | "video" | "design")[] = ["design"]

  async isConfigured(workspaceId: string): Promise<boolean> {
    const cred = await getCredential(workspaceId, this.type)
    return !!(cred?.accessToken && cred?.refreshToken)
  }

  async getAuthorizationUrl(workspaceId: string, state: string): Promise<string> {
    const app = await resolveCanvaAppCredentials(workspaceId)
    if (!app) {
      throw new Error("Canva app credentials are not configured")
    }

    const params = new URLSearchParams({
      client_id: app.clientId,
      redirect_uri: canvaRedirectUri(),
      response_type: "code",
      scope: "design:manage,design:read,design:metadata:read",
      state,
    })
    return `https://www.canva.com/api/oauth/authorize?${params.toString()}`
  }

  async exchangeCode(
    workspaceId: string,
    code: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const app = await resolveCanvaAppCredentials(workspaceId)
    if (!app) {
      throw new Error("Canva app credentials are not configured")
    }

    const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: app.clientId,
        client_secret: app.clientSecret,
        redirect_uri: canvaRedirectUri(),
        grant_type: "authorization_code",
      }),
    })

    if (!response.ok) throw new Error("Canva OAuth exchange failed")

    const data = (await response.json()) as {
      access_token: string
      refresh_token: string
    }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }
  }

  async createDesign(
    input: DesignInput,
    cred: { accessToken?: string; refreshToken?: string }
  ): Promise<ConnectorResult> {
    if (!cred?.accessToken) throw new Error("Canva access token required")

    const templateId = input.templateId || process.env.CANVA_DEFAULT_TEMPLATE

    if (!templateId) throw new Error("No Canva template ID configured")

    const response = await fetch(
      `https://api.canva.com/rest/v1/designs/${templateId}/autofill`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cred.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            title: input.title,
            ...(input.body && { body: input.body.join("\n") }),
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Canva autofill error: ${error}`)
    }

    const data = (await response.json()) as { design_id?: string }

    if (data.design_id) {
      return this.exportDesign(data.design_id, cred.accessToken)
    }

    throw new Error("No design ID returned")
  }

  private async exportDesign(
    designId: string,
    accessToken: string
  ): Promise<ConnectorResult> {
    const exportResp = await fetch(
      `https://api.canva.com/rest/v1/designs/${designId}/export`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: "PNG",
          quality: "STANDARD",
        }),
      }
    )

    if (!exportResp.ok) throw new Error("Canva export failed")

    const exportData = (await exportResp.json()) as { url?: string }

    if (exportData.url) {
      return {
        assets: [
          {
            url: exportData.url,
            mime: "image/png",
            filename: `canva-${designId}.png`,
          },
        ],
      }
    }

    throw new Error("No export URL returned")
  }
}

export const canvaConnector = new CanvaConnector()
