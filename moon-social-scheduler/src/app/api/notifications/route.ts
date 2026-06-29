import { z } from "zod"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { isDatabaseConfigured } from "@/lib/db/runtime"

export async function GET() {
  try {
    const { workspace } = await requireUserContext()
    const notifications = await prisma.notification.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const unread = notifications.filter((item) => item.readAt === null).length

    return json({
      unread,
      notifications: notifications.map((item) => ({
        id: item.id,
        type: item.type,
        severity: item.severity,
        title: item.title,
        body: item.body,
        link: item.link,
        read: item.readAt !== null,
        createdAt: item.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    if (isDatabaseConfigured()) {
      return errorJson(error)
    }
    return json({ unread: 0, notifications: [] })
  }
}

const patchSchema = z.object({
  id: z.string().optional(),
  markAllRead: z.boolean().optional(),
})

export async function PATCH(request: Request) {
  try {
    const { workspace } = await requireUserContext()
    const input = patchSchema.parse(await request.json())

    if (input.markAllRead) {
      await prisma.notification.updateMany({
        where: { workspaceId: workspace.id, readAt: null },
        data: { readAt: new Date() },
      })
    } else if (input.id) {
      await prisma.notification.updateMany({
        where: { id: input.id, workspaceId: workspace.id },
        data: { readAt: new Date() },
      })
    }

    return json({ ok: true })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    return errorJson(error)
  }
}
