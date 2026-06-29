import { z } from "zod"
import { Platform } from "@/lib/domain/enums"
import { json } from "@/lib/api/response"
import { withApiKey } from "@/lib/api/v1"
import { prisma } from "@/lib/db/client"
import { createPostForWorkspace } from "@/lib/posts/service"

export const runtime = "nodejs"

const createSchema = z.object({
  text: z.string().min(1),
  scheduledAt: z.string().datetime().optional().nullable(),
  timezone: z.string().default("UTC"),
  targetAccountIds: z.array(z.string()).default([]),
  mediaAssetIds: z.array(z.string()).default([]),
  publishNow: z.boolean().default(false),
  versions: z
    .array(
      z.object({
        platform: z.enum(Object.values(Platform) as [Platform, ...Platform[]]),
        text: z.string().min(1),
        settings: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .default([]),
})

export const GET = withApiKey("posts:read", async (_request, context) => {
  const posts = await prisma.post.findMany({
    where: { workspaceId: context.workspaceId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { targets: true },
  })

  return json({
    posts: posts.map((post) => ({
      id: post.id,
      status: post.status,
      baseText: post.baseText,
      scheduledAt: post.scheduledAt?.toISOString() ?? null,
      targets: post.targets.map((target) => ({
        platform: target.platform,
        status: target.status,
      })),
    })),
  })
})

export const POST = withApiKey("posts:write", async (request, context) => {
  const input = createSchema.parse(await request.json())

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId: context.workspaceId },
    orderBy: { createdAt: "asc" },
  })
  if (!member) {
    return json({ error: "Workspace has no members" }, { status: 400 })
  }

  const { post, publishJob } = await createPostForWorkspace(
    context.workspaceId,
    member.userId,
    {
      baseText: input.text,
      scheduledAt: input.scheduledAt,
      timezone: input.timezone,
      targetAccountIds: input.targetAccountIds,
      mediaAssetIds: input.mediaAssetIds,
      versions: input.versions,
      publishNow: input.publishNow,
    }
  )

  return json({ id: post.id, status: post.status, publishJobId: publishJob?.id ?? null }, { status: 201 })
})
