import { z } from "zod"
import {
  Platform,
  PostStatus,
  PublishJobStatus,
  PublishTargetStatus,
} from "@/lib/domain/enums"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { isDatabaseConfigured } from "@/lib/db/runtime"
import {
  assertCanCreatePost,
  incrementUsage,
  PlanLimitError,
} from "@/lib/billing/subscription"
import { createPost, listPosts } from "@/lib/local-dev/store"

const createPostSchema = z.object({
  baseText: z.string().min(1),
  scheduledAt: z.string().datetime().optional().nullable(),
  timezone: z.string().default("UTC"),
  mediaAssetIds: z.array(z.string()).default([]),
  targetAccountIds: z.array(z.string()).default([]),
  versions: z
    .array(
      z.object({
        platform: z.enum(Object.values(Platform) as [Platform, ...Platform[]]),
        text: z.string().min(1),
        settings: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .default([]),
  publishNow: z.boolean().default(false),
})

export async function GET() {
  try {
    const { workspace } = await requireUserContext()
    const posts = await prisma.post.findMany({
      where: { workspaceId: workspace.id },
      include: {
        targets: {
          include: {
            socialAccount: true,
          },
        },
        media: {
          include: {
            mediaAsset: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return json({
      posts: posts.map((post) => ({
        id: post.id,
        baseText: post.baseText,
        status: post.status,
        scheduledAt: post.scheduledAt?.toISOString() ?? null,
        timezone: post.timezone,
        media: post.media.map(({ mediaAsset }) => ({
          id: mediaAsset.id,
          type: mediaAsset.type,
          fileName: mediaAsset.fileName,
          mimeType: mediaAsset.mimeType,
          byteSize: String(mediaAsset.byteSize),
          publicUrl: mediaAsset.publicUrl,
        })),
        targets: post.targets.map((target) => ({
          platform: target.platform,
          status: target.status,
          socialAccount: {
            id: target.socialAccount.id,
            platform: target.socialAccount.platform,
            username: target.socialAccount.username,
            displayName: target.socialAccount.displayName,
            status: target.socialAccount.status,
            avatarUrl: target.socialAccount.avatarUrl,
            expiresAt: target.socialAccount.expiresAt?.toISOString() ?? null,
          },
        })),
      })),
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    if (isDatabaseConfigured()) {
      return errorJson(error)
    }
    return json({ posts: listPosts() })
  }
}

export async function POST(request: Request) {
  const payload = await request.json()

  try {
    const input = createPostSchema.parse(payload)
    const { user, workspace } = await requireUserContext()

    await assertCanCreatePost(workspace.id)

    const accounts = await prisma.socialAccount.findMany({
      where: {
        workspaceId: workspace.id,
        id: { in: input.targetAccountIds },
      },
    })

    if (accounts.length > 0) {
      const scheduledAt = input.publishNow
        ? new Date()
        : input.scheduledAt
          ? new Date(input.scheduledAt)
          : null
      const status = input.publishNow
        ? PostStatus.QUEUED
        : scheduledAt
          ? PostStatus.SCHEDULED
          : PostStatus.DRAFT

      const post = await prisma.post.create({
        data: {
          workspaceId: workspace.id,
          creatorId: user.id,
          baseText: input.baseText,
          scheduledAt,
          timezone: input.timezone,
          status,
          versions: {
            create: input.versions.map((version) => ({
              platform: version.platform,
              text: version.text,
              settings: version.settings ?? undefined,
            })),
          },
          targets: {
            create: accounts.map((account) => ({
              socialAccountId: account.id,
              platform: account.platform,
              status: scheduledAt
                ? PublishTargetStatus.SCHEDULED
                : PublishTargetStatus.DRAFT,
              scheduledAt,
            })),
          },
          media: {
            create: input.mediaAssetIds.map((mediaAssetId, index) => ({
              mediaAssetId,
              sortOrder: index,
            })),
          },
        },
        include: {
          targets: true,
        },
      })

      const publishJob = scheduledAt
        ? await prisma.publishJob.create({
            data: {
              postId: post.id,
              status: PublishJobStatus.WAITING,
              runAt: scheduledAt,
            },
          })
        : null

      await incrementUsage(workspace.id, "postsCreated")

      return json({ post, publishJob }, { status: 201 })
    }

    const post = createPost({
      baseText: input.baseText,
      scheduledAt: input.publishNow ? new Date().toISOString() : input.scheduledAt,
      timezone: input.timezone,
      targetAccountIds: input.targetAccountIds,
      mediaAssetIds: input.mediaAssetIds,
    })

    return json({ post, publishJob: null }, { status: 201 })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    if (error instanceof PlanLimitError) {
      return errorJson(error, 402)
    }
    if (isDatabaseConfigured()) {
      return errorJson(error)
    }
    const input = createPostSchema.parse(payload)
    const post = createPost({
      baseText: input.baseText,
      scheduledAt: input.publishNow ? new Date().toISOString() : input.scheduledAt,
      timezone: input.timezone,
      targetAccountIds: input.targetAccountIds,
      mediaAssetIds: input.mediaAssetIds,
    })

    return json({ post, publishJob: null }, { status: 201 })
  }
}
