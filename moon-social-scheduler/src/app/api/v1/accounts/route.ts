import { json } from "@/lib/api/response"
import { withApiKey } from "@/lib/api/v1"
import { prisma } from "@/lib/db/client"

export const runtime = "nodejs"

export const GET = withApiKey("accounts:read", async (_request, context) => {
  const accounts = await prisma.socialAccount.findMany({
    where: { workspaceId: context.workspaceId },
    orderBy: { createdAt: "asc" },
  })

  return json({
    accounts: accounts.map((account) => ({
      id: account.id,
      platform: account.platform,
      username: account.username,
      displayName: account.displayName,
      status: account.status,
      expiresAt: account.expiresAt?.toISOString() ?? null,
    })),
  })
})
