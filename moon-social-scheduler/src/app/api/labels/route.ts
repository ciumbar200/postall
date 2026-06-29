import { z } from "zod"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { isDatabaseConfigured } from "@/lib/db/runtime"

export const runtime = "nodejs"

export async function GET() {
  try {
    const { workspace } = await requireUserContext()
    const labels = await prisma.postLabel.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: true } } },
    })

    return json({
      labels: labels.map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
        postCount: label._count.posts,
      })),
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorJson(error, 401)
    if (isDatabaseConfigured()) return errorJson(error)
    return json({ labels: [] })
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
})

export async function POST(request: Request) {
  try {
    const { workspace } = await requireUserContext()
    const input = createSchema.parse(await request.json())

    const label = await prisma.postLabel.create({
      data: {
        workspaceId: workspace.id,
        name: input.name.trim(),
        color: input.color ?? "#6366f1",
      },
    })

    return json({ id: label.id, name: label.name, color: label.color })
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorJson(error, 401)
    return errorJson(error)
  }
}

const deleteSchema = z.object({ id: z.string() })

export async function DELETE(request: Request) {
  try {
    const { workspace } = await requireUserContext()
    const { id } = deleteSchema.parse(await request.json())

    await prisma.postLabel.deleteMany({
      where: { id, workspaceId: workspace.id },
    })

    return json({ ok: true })
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorJson(error, 401)
    return errorJson(error)
  }
}
