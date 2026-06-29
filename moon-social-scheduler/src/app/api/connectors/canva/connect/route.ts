import { json, errorJson } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { assertFeature, PlanLimitError } from "@/lib/billing/subscription"
import { prisma } from "@/lib/db/client"
import { Platform } from "@/generated/prisma/enums"

export const runtime = "nodejs"

const CANVA_OAUTH_VERIFIER = "connector:CANVA"

export async function GET() {
  try {
    const { userId, workspaceId } = await requireUserContext()
    await assertFeature(workspaceId, "connectors")

    const state = Buffer.from(
      JSON.stringify({ workspaceId, userId, ts: Date.now() })
    ).toString("base64url")

    await prisma.oAuthState.create({
      data: {
        state,
        platform: Platform.INSTAGRAM,
        userId,
        workspaceId,
        verifier: CANVA_OAUTH_VERIFIER,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        redirectTo: "/dashboard/connectors",
      },
    })

    const { canvaConnector } = await import("@/lib/connectors/canva")
    const authUrl = await canvaConnector.getAuthorizationUrl(workspaceId, state)

    return json({ url: authUrl })
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
