import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/client"
import { ConnectorType } from "@/generated/prisma/enums"
import { setCredential } from "@/lib/connectors/credentials"

export const runtime = "nodejs"

const CANVA_OAUTH_VERIFIER = "connector:CANVA"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    redirect(`/dashboard/connectors?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    redirect("/dashboard/connectors?error=missing_params")
  }

  const oauthState = await prisma.oAuthState.findUnique({
    where: { state },
  })

  if (!oauthState || oauthState.verifier !== CANVA_OAUTH_VERIFIER) {
    redirect("/dashboard/connectors?error=invalid_state")
  }

  if (oauthState.expiresAt < new Date()) {
    await prisma.oAuthState.delete({ where: { state } }).catch(() => {})
    redirect("/dashboard/connectors?error=expired_state")
  }

  await prisma.oAuthState.delete({ where: { state } })

  try {
    const { canvaConnector } = await import("@/lib/connectors/canva")
    const tokens = await canvaConnector.exchangeCode(oauthState.workspaceId, code)

    await setCredential(oauthState.workspaceId, ConnectorType.CANVA, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })

    redirect("/dashboard/connectors?success=canva")
  } catch (err) {
    redirect(`/dashboard/connectors?error=${encodeURIComponent(String(err))}`)
  }
}
