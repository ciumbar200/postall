import {
  Platform,
  PostStatus,
  PublishJobStatus,
  PublishTargetStatus,
} from "@/lib/domain/enums"
import { prisma } from "@/lib/db/client"
import { assertCanCreatePost, incrementUsage } from "@/lib/billing/subscription"

export type CreatePostInput = {
  baseText: string
  scheduledAt?: string | null
  timezone?: string
  targetAccountIds?: string[]
  mediaAssetIds?: string[]
  versions?: Array<{
    platform: Platform
    text: string
    settings?: Record<string, unknown>
  }>
  publishNow?: boolean
}

export async function createPostForWorkspace(
  workspaceId: string,
  creatorId: string,
  input: CreatePostInput
) {
  await assertCanCreatePost(workspaceId)

  const targetAccountIds = input.targetAccountIds ?? []
  const accounts = await prisma.socialAccount.findMany({
    where: { workspaceId, id: { in: targetAccountIds } },
  })

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
      workspaceId,
      creatorId,
      baseText: input.baseText,
      scheduledAt,
      timezone: input.timezone ?? "UTC",
      status,
      versions: {
        create: (input.versions ?? []).map((version) => ({
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
        create: (input.mediaAssetIds ?? []).map((mediaAssetId, index) => ({
          mediaAssetId,
          sortOrder: index,
        })),
      },
    },
    include: { targets: true },
  })

  const publishJob =
    scheduledAt || input.publishNow
      ? await prisma.publishJob.create({
          data: {
            postId: post.id,
            status: PublishJobStatus.WAITING,
            runAt: scheduledAt ?? new Date(),
          },
        })
      : null

  await incrementUsage(workspaceId, "postsCreated")

  return { post, publishJob }
}

export async function getPostStatusForWorkspace(workspaceId: string, postId: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, workspaceId },
    include: {
      targets: { include: { socialAccount: true } },
      jobs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  })

  if (!post) return null

  return {
    id: post.id,
    status: post.status,
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    baseText: post.baseText,
    targets: post.targets.map((target) => ({
      platform: target.platform,
      status: target.status,
      externalUrl: target.externalUrl,
      errorMessage: target.errorMessage,
      account: target.socialAccount.username,
    })),
    lastJob: post.jobs[0]
      ? { status: post.jobs[0].status, runAt: post.jobs[0].runAt.toISOString() }
      : null,
  }
}
