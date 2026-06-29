import { z } from "zod"
import {
  PostStatus,
  PublishJobStatus,
  PublishTargetStatus,
  WorkspaceRole,
} from "@/lib/domain/enums"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"

export const runtime = "nodejs"

const APPROVER_ROLES: string[] = [
  WorkspaceRole.OWNER,
  WorkspaceRole.ADMIN,
  WorkspaceRole.APPROVER,
]

const schema = z.object({
  scheduledAt: z.string().datetime().optional().nullable(),
})

export async function POST(
  request: Request,
  context: RouteContext<"/api/posts/[id]/approve">
) {
  try {
    const { workspace, role } = await requireUserContext()

    if (!APPROVER_ROLES.includes(role)) {
      return errorJson(new Error("No tienes permisos para aprobar publicaciones."), 403)
    }

    const { id } = await context.params
    const input = schema.parse(await request.json().catch(() => ({})))

    const post = await prisma.post.findFirst({
      where: { id, workspaceId: workspace.id },
    })
    if (!post) {
      return errorJson(new Error("Post no encontrado."), 404)
    }

    const scheduledAt = input.scheduledAt
      ? new Date(input.scheduledAt)
      : (post.scheduledAt ?? new Date())

    const updated = await prisma.post.update({
      where: { id: post.id },
      data: {
        status: PostStatus.SCHEDULED,
        scheduledAt,
        targets: { updateMany: { where: {}, data: { status: PublishTargetStatus.SCHEDULED, scheduledAt } } },
      },
    })

    await prisma.publishJob.create({
      data: { postId: post.id, status: PublishJobStatus.WAITING, runAt: scheduledAt },
    })

    return json({ id: updated.id, status: updated.status, scheduledAt })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    return errorJson(error)
  }
}
