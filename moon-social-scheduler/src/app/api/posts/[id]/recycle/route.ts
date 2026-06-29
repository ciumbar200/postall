import { z } from "zod"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { createPostForWorkspace } from "@/lib/posts/service"
import { PlanLimitError } from "@/lib/billing/subscription"

export const runtime = "nodejs"

const schema = z.object({
  scheduledAt: z.string().datetime().optional().nullable(),
})

export async function POST(
  request: Request,
  context: RouteContext<"/api/posts/[id]/recycle">
) {
  try {
    const { user, workspace } = await requireUserContext()
    const { id } = await context.params
    const input = schema.parse(await request.json().catch(() => ({})))

    const original = await prisma.post.findFirst({
      where: { id, workspaceId: workspace.id },
      include: {
        versions: true,
        media: { orderBy: { sortOrder: "asc" } },
        targets: true,
      },
    })

    if (!original) {
      return errorJson(new Error("Post no encontrado."), 404)
    }

    const scheduledAt =
      input.scheduledAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { post } = await createPostForWorkspace(workspace.id, user.id, {
      baseText: original.baseText,
      scheduledAt,
      timezone: original.timezone,
      targetAccountIds: original.targets.map((target) => target.socialAccountId),
      mediaAssetIds: original.media.map((media) => media.mediaAssetId),
      versions: original.versions.map((version) => ({
        platform: version.platform,
        text: version.text,
        settings: (version.settings as Record<string, unknown> | null) ?? undefined,
      })),
    })

    return json({ id: post.id, recycledFrom: original.id, scheduledAt }, { status: 201 })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    if (error instanceof PlanLimitError) {
      return errorJson(error, 402)
    }
    return errorJson(error)
  }
}
