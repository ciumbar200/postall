import {
  Platform,
  PostStatus,
  PublishJobStatus,
  PublishTargetStatus,
} from "@/lib/domain/enums"
import { prisma } from "@/lib/db/client"
import { toPrismaJson } from "@/lib/db/json"
import { getPlatformAdapter } from "@/lib/platforms/registry"
import type { PlatformMedia } from "@/lib/platforms/types"
import { createNotification } from "@/lib/notifications/service"
import { dispatchWebhook } from "@/lib/webhooks/deliver"
import { optionalEnv } from "@/lib/env"

function toPlatformMedia(media: Array<{
  sortOrder: number
  mediaAsset: {
    id: string
    type: "IMAGE" | "GIF" | "VIDEO"
    mimeType: string
    byteSize: bigint
    publicUrl: string
    altText: string | null
  }
}>): PlatformMedia[] {
  return media
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ mediaAsset }) => ({
      id: mediaAsset.id,
      type: mediaAsset.type,
      mimeType: mediaAsset.mimeType,
      byteSize: Number(mediaAsset.byteSize),
      publicUrl: mediaAsset.publicUrl,
      altText: mediaAsset.altText,
    }))
}

export async function publishPostJob(publishJobId: string) {
  const publishJob = await prisma.publishJob.update({
    where: { id: publishJobId },
    data: {
      status: PublishJobStatus.ACTIVE,
      attempts: { increment: 1 },
    },
    include: {
      post: {
        include: {
          versions: true,
          media: {
            include: {
              mediaAsset: true,
            },
          },
          targets: {
            include: {
              socialAccount: true,
            },
          },
        },
      },
    },
  })

  await prisma.post.update({
    where: { id: publishJob.postId },
    data: { status: PostStatus.PUBLISHING },
  })

  const media = toPlatformMedia(publishJob.post.media)
  const results = await Promise.allSettled(
    publishJob.post.targets.map(async (target) => {
      const adapter = getPlatformAdapter(target.platform)
      const version =
        publishJob.post.versions.find((item) => item.platform === target.platform) ??
        null

      await prisma.postTarget.update({
        where: { id: target.id },
        data: { status: PublishTargetStatus.PUBLISHING },
      })

      const result = await adapter.publish({
        postId: publishJob.postId,
        targetId: target.id,
        account: {
          id: target.socialAccount.id,
          providerAccountId: target.socialAccount.providerAccountId,
          username: target.socialAccount.username,
          accessToken: target.socialAccount.accessToken,
          refreshToken: target.socialAccount.refreshToken,
          expiresAt: target.socialAccount.expiresAt,
          metadata: target.socialAccount.metadata as Record<string, unknown> | null,
        },
        text: version?.text ?? publishJob.post.baseText,
        media,
        settings: version?.settings as Record<string, unknown> | null,
      })

      await prisma.postTarget.update({
        where: { id: target.id },
        data: {
          status: PublishTargetStatus.PUBLISHED,
          publishedAt: new Date(),
          externalPostId: result.externalPostId,
          externalUrl: result.externalUrl,
          result: toPrismaJson(result.raw),
          errorCode: null,
          errorMessage: null,
        },
      })

      await prisma.publishAttempt.create({
        data: {
          publishJobId,
          platform: target.platform,
          status: "published",
          payload: toPrismaJson(result.raw),
        },
      })

      const settings = (version?.settings as Record<string, unknown> | null) ?? null
      const firstComment =
        typeof settings?.firstComment === "string" ? settings.firstComment.trim() : ""
      if (firstComment && adapter.publishComment) {
        try {
          await adapter.publishComment({
            account: {
              id: target.socialAccount.id,
              providerAccountId: target.socialAccount.providerAccountId,
              username: target.socialAccount.username,
              accessToken: target.socialAccount.accessToken,
              refreshToken: target.socialAccount.refreshToken,
              expiresAt: target.socialAccount.expiresAt,
              metadata: target.socialAccount.metadata as Record<string, unknown> | null,
            },
            externalPostId: result.externalPostId,
            text: firstComment,
          })
        } catch (commentError) {
          console.error("Failed to publish first comment", commentError)
        }
      }
    })
  )

  const failed = results.filter((result) => result.status === "rejected")

  for (const [index, result] of results.entries()) {
    if (result.status !== "rejected") {
      continue
    }

    const target = publishJob.post.targets[index]
    const message = result.reason instanceof Error ? result.reason.message : String(result.reason)

    await prisma.postTarget.update({
      where: { id: target.id },
      data: {
        status: PublishTargetStatus.FAILED,
        errorCode: "PUBLISH_FAILED",
        errorMessage: message,
      },
    })

    await prisma.publishAttempt.create({
      data: {
        publishJobId,
        platform: target.platform,
        status: "failed",
        message,
      },
    })

    try {
      const base = optionalEnv("APP_URL", "https://app.postall.app").replace(/\/$/, "")
      await createNotification({
        workspaceId: publishJob.post.workspaceId,
        type: "PUBLISH_FAILED",
        severity: "ERROR",
        title: `Fallo al publicar en ${target.platform}`,
        body: `No se pudo publicar tu post en ${target.platform}. Motivo: ${message}`,
        link: `${base}/dashboard/queue`,
        metadata: { postId: publishJob.postId, targetId: target.id, platform: target.platform },
        email: true,
      })
    } catch (notifyError) {
      console.error("Failed to create publish-failure notification", notifyError)
    }
  }

  const nextPostStatus =
    failed.length === 0
      ? PostStatus.PUBLISHED
      : failed.length === results.length
        ? PostStatus.FAILED
        : PostStatus.PARTIALLY_PUBLISHED

  await prisma.post.update({
    where: { id: publishJob.postId },
    data: {
      status: nextPostStatus,
      publishedAt: nextPostStatus === PostStatus.FAILED ? null : new Date(),
    },
  })

  await prisma.publishJob.update({
    where: { id: publishJobId },
    data: {
      status: failed.length === results.length ? PublishJobStatus.FAILED : PublishJobStatus.COMPLETED,
      lastError:
        failed.length > 0
          ? failed
              .map((result) =>
                result.status === "rejected" && result.reason instanceof Error
                  ? result.reason.message
                  : "Unknown publish failure"
              )
              .join("\n")
          : null,
    },
  })

  try {
    await dispatchWebhook(
      publishJob.post.workspaceId,
      nextPostStatus === PostStatus.FAILED ? "post.failed" : "post.published",
      {
        postId: publishJob.postId,
        status: nextPostStatus,
        published: results.length - failed.length,
        failed: failed.length,
        targets: publishJob.post.targets.map((target) => ({
          platform: target.platform,
          accountId: target.socialAccountId,
        })),
      }
    )
  } catch (webhookError) {
    console.error("Failed to dispatch publish webhook", webhookError)
  }

  return { failed: failed.length, total: results.length }
}

export function platformStatusLabel(platform: Platform) {
  return platform.toLowerCase().replaceAll("_", " ")
}
