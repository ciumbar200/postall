import { json, errorJson } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireUserContext()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    const runs = await prisma.agentRun.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    })

    const total = await prisma.agentRun.count({ where: { workspaceId } })

    return json({ runs, total, limit, offset })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    return errorJson(error)
  }
}
