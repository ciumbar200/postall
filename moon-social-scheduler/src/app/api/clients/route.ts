import { z } from "zod"
import { WorkspaceRole } from "@/lib/domain/enums"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { isDatabaseConfigured } from "@/lib/db/runtime"
import {
  assertFeature,
  getWorkspaceLimits,
  PlanLimitError,
} from "@/lib/billing/subscription"

export const runtime = "nodejs"

function slugify(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cliente"
  return `${base}-${Math.random().toString(36).slice(2, 7)}`
}

export async function GET() {
  try {
    const { workspace } = await requireUserContext()
    const clients = await prisma.workspace.findMany({
      where: { parentWorkspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { socialAccounts: true, posts: true, members: true } },
      },
    })

    return json({
      clients: clients.map((client) => ({
        id: client.id,
        name: client.name,
        slug: client.slug,
        channels: client._count.socialAccounts,
        posts: client._count.posts,
        members: client._count.members,
        createdAt: client.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorJson(error, 401)
    if (isDatabaseConfigured()) return errorJson(error)
    return json({ clients: [] })
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
})

export async function POST(request: Request) {
  try {
    const { user, workspace } = await requireUserContext()
    await assertFeature(workspace.id, "reselling")
    const { name } = createSchema.parse(await request.json())

    const limits = await getWorkspaceLimits(workspace.id)
    const existing = await prisma.workspace.count({
      where: { parentWorkspaceId: workspace.id },
    })
    if (existing >= limits.maxClientWorkspaces) {
      throw new PlanLimitError(
        `Tu plan permite ${limits.maxClientWorkspaces} workspaces de cliente.`
      )
    }

    const client = await prisma.workspace.create({
      data: {
        name,
        slug: slugify(name),
        parentWorkspaceId: workspace.id,
        members: {
          create: { userId: user.id, role: WorkspaceRole.OWNER },
        },
      },
    })

    return json({ id: client.id, name: client.name, slug: client.slug })
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorJson(error, 401)
    if (error instanceof PlanLimitError) return errorJson(error, 402)
    return errorJson(error)
  }
}
