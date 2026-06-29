import { z } from "zod"
import { json, errorJson } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { ConnectorType, AssetKind } from "@/generated/prisma/enums"
import { ensureConnectorsLoaded, getConnector } from "@/lib/connectors/registry"
import { getCredentialRecord } from "@/lib/connectors/credentials"
import { saveGeneratedAsset } from "@/lib/connectors/persist-asset"
import { assertFeature, PlanLimitError } from "@/lib/billing/subscription"

export const runtime = "nodejs"

const imageSchema = z.object({
  type: z.literal("image"),
  prompt: z.string(),
  aspectRatio: z.string().optional(),
  n: z.number().int().min(1).max(4).optional(),
})

const videoSchema = z.object({
  type: z.literal("video"),
  script: z.string(),
  avatarId: z.string().optional(),
  voiceId: z.string().optional(),
  aspectRatio: z.string().optional(),
})

const designSchema = z.object({
  type: z.literal("design"),
  title: z.string(),
  body: z.array(z.string()).optional(),
  templateId: z.string().optional(),
})

const inputSchema = z.discriminatedUnion("type", [
  imageSchema,
  videoSchema,
  designSchema,
])

export async function POST(
  request: Request,
  { params }: { params: Promise<{ connector: string }> }
) {
  try {
    const { userId, workspaceId } = await requireUserContext()
    await assertFeature(workspaceId, "connectors")
    const { connector: connectorParam } = await params

    const connector = connectorParam.toUpperCase() as ConnectorType
    if (!Object.values(ConnectorType).includes(connector)) {
      return errorJson({ message: "Invalid connector" }, 400)
    }

    const input = inputSchema.parse(await request.json())

    await ensureConnectorsLoaded()
    const connectorInstance = getConnector(connector)
    if (!connectorInstance) {
      return errorJson({ message: "Connector not available" }, 400)
    }

    const record = await getCredentialRecord(workspaceId, connector)
    if (!record) {
      return errorJson({ message: "Connector not configured" }, 400)
    }

    switch (input.type) {
      case "image": {
        if (!connectorInstance.generateImage) {
          return errorJson({ message: "Image generation not supported" }, 400)
        }
        const result = await connectorInstance.generateImage(
          { prompt: input.prompt, aspectRatio: input.aspectRatio, n: input.n },
          record.cred
        )
        const saved = await saveGeneratedAsset({
          workspaceId,
          uploaderId: userId,
          connector,
          kind: AssetKind.IMAGE,
          prompt: input.prompt,
          result,
        })
        return json(saved)
      }
      case "video": {
        if (!connectorInstance.generateVideo) {
          return errorJson({ message: "Video generation not supported" }, 400)
        }
        const result = await connectorInstance.generateVideo(
          {
            script: input.script,
            avatarId: input.avatarId,
            voiceId: input.voiceId,
            aspectRatio: input.aspectRatio,
          },
          record.cred
        )
        const saved = await saveGeneratedAsset({
          workspaceId,
          uploaderId: userId,
          connector,
          kind: AssetKind.VIDEO,
          prompt: input.script,
          result,
          meta: { avatarId: input.avatarId, voiceId: input.voiceId },
        })
        return json(saved)
      }
      case "design": {
        if (!connectorInstance.createDesign) {
          return errorJson({ message: "Design creation not supported" }, 400)
        }
        const result = await connectorInstance.createDesign(
          { title: input.title, body: input.body, templateId: input.templateId },
          record.cred
        )
        const saved = await saveGeneratedAsset({
          workspaceId,
          uploaderId: userId,
          connector,
          kind: AssetKind.DESIGN,
          prompt: input.title,
          result,
        })
        return json(saved)
      }
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    if (error instanceof PlanLimitError) {
      return errorJson(error, 403)
    }
    return errorJson(error)
  }
}
