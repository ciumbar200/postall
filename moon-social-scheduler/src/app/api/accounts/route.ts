import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { isDatabaseConfigured } from "@/lib/db/runtime"
import { listAccounts, revokeAccount } from "@/lib/local-dev/store"

export async function GET() {
  try {
    const { workspace } = await requireUserContext()
    const accounts = await prisma.socialAccount.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "asc" },
    })

    return json({
      accounts: accounts.map((account) => ({
        id: account.id,
        platform: account.platform,
        username: account.username,
        displayName: account.displayName,
        status: account.status,
        avatarUrl: account.avatarUrl,
        expiresAt: account.expiresAt?.toISOString() ?? null,
        disconnectedAt: account.disconnectedAt?.toISOString() ?? null,
      })),
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    if (isDatabaseConfigured()) {
      return errorJson(error)
    }
    return json({ accounts: listAccounts() })
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => ({ id: undefined }))) as { id?: string }

  try {
    const { id } = body

    if (!id) {
      return errorJson(new Error("Missing account id."), 400)
    }

    const { workspace } = await requireUserContext()

    const account = await prisma.socialAccount.updateMany({
      where: { id, workspaceId: workspace.id },
      data: {
        status: "REVOKED",
        disconnectedAt: new Date(),
      },
    })

    if (account.count === 0) {
      revokeAccount(id)
    }

    return json({ ok: true })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    if (isDatabaseConfigured()) {
      return errorJson(error)
    }
    const { id } = body
    if (!id) {
      return errorJson(error)
    }
    revokeAccount(id)
    return json({ ok: true })
  }
}
