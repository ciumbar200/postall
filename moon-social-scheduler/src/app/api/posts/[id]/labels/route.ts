import { z } from "zod"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"

export const runtime = "nodejs"

const schema = z.object({
  labelIds: z.array(z.string()).default([]),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace } = await requireUserContext()
    const { id } = await params
    const { labelIds } = schema.parse(await request.json())

    const post = await prisma.post.findFirst({
      where: { id, workspaceId: workspace.id },
      select: { id: true },
    })
    if (!post) return errorJson(new Error("Post no encontrado"), 404)

    // Only allow labels that belong to this workspace.
    const validLabels = await prisma.postLabel.findMany({
      where: { id: { in: labelIds }, workspaceId: workspace.id },
      select: { id: true },
    })
    const validIds = validLabels.map((l) => l.id)

    await prisma.$transaction([
      prisma.postLabelOnPost.deleteMany({ where: { postId: post.id } }),
      prisma.postLabelOnPost.createMany({
        data: validIds.map((labelId) => ({ postId: post.id, labelId })),
        skipDuplicates: true,
      }),
    ])

    return json({ ok: true, labelIds: validIds })
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorJson(error, 401)
    return errorJson(error)
  }
}
