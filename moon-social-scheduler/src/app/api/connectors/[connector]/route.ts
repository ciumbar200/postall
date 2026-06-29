import { z } from "zod"
import { json, errorJson } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { ConnectorType } from "@/generated/prisma/enums"
import { setCredential, deleteCredential } from "@/lib/connectors/credentials"
import { assertFeature, PlanLimitError } from "@/lib/billing/subscription"

export const runtime = "nodejs"

const schema = z.object({
  apiKey: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  webhookSecret: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  avatarId: z.string().optional(),
  voiceId: z.string().optional(),
  imageModel: z.string().optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ connector: string }> }
) {
  try {
    const { workspaceId } = await requireUserContext()
    await assertFeature(workspaceId, "connectors")
    const { connector: connectorParam } = await params

    const connector = connectorParam.toUpperCase() as ConnectorType
    if (!Object.values(ConnectorType).includes(connector)) {
      return errorJson({ message: "Invalid connector" }, 400)
    }

    const input = schema.parse(await request.json())
    await setCredential(workspaceId, connector, input)

    return json({ success: true })
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ connector: string }> }
) {
  try {
    const { workspaceId } = await requireUserContext()
    await assertFeature(workspaceId, "connectors")
    const { connector: connectorParam } = await params

    const connector = connectorParam.toUpperCase() as ConnectorType
    if (!Object.values(ConnectorType).includes(connector)) {
      return errorJson({ message: "Invalid connector" }, 400)
    }

    await deleteCredential(workspaceId, connector)

    return json({ success: true })
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
