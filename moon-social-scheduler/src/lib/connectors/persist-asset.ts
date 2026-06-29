import { prisma } from "@/lib/db/client"
import { AssetKind, ConnectorType } from "@/generated/prisma/enums"
import type { ConnectorAsset, ConnectorResult } from "./types"
import { getCredentialRecord } from "./credentials"
import { persistBufferMedia, persistUrlMedia } from "@/lib/storage/buffer"

export type SaveGeneratedAssetInput = {
  workspaceId: string
  uploaderId: string
  connector: ConnectorType
  kind: AssetKind
  prompt: string
  result: ConnectorResult
  meta?: Record<string, unknown>
}

async function assetToMedia(
  asset: ConnectorAsset,
  uploaderId: string,
  workspaceId: string,
  kind: AssetKind
) {
  const mime =
    asset.mime ||
    (kind === AssetKind.VIDEO ? "video/mp4" : "image/png")
  const fileName = asset.filename || `${kind.toLowerCase()}-${Date.now()}`

  if (asset.buffer) {
    const stored = await persistBufferMedia({
      buffer: Buffer.from(asset.buffer),
      fileName,
      mimeType: mime,
    })
    return prisma.mediaAsset.create({
      data: {
        workspaceId,
        uploaderId,
        type: stored.type,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        byteSize: stored.byteSize,
        storageKey: stored.storageKey,
        publicUrl: stored.publicUrl,
      },
    })
  }

  if (asset.url) {
    try {
      const stored = await persistUrlMedia({
        url: asset.url,
        fileName,
        mimeType: mime,
      })
      return prisma.mediaAsset.create({
        data: {
          workspaceId,
          uploaderId,
          type: stored.type,
          fileName: stored.fileName,
          mimeType: stored.mimeType,
          byteSize: stored.byteSize,
          storageKey: stored.storageKey,
          publicUrl: stored.publicUrl,
        },
      })
    } catch {
      return prisma.mediaAsset.create({
        data: {
          workspaceId,
          uploaderId,
          type: kind === AssetKind.VIDEO ? "VIDEO" : "IMAGE",
          fileName,
          mimeType: mime,
          byteSize: BigInt(0),
          storageKey: `external/${asset.url}`,
          publicUrl: asset.url,
        },
      })
    }
  }

  return null
}

export async function saveGeneratedAsset(input: SaveGeneratedAssetInput) {
  const record = await getCredentialRecord(input.workspaceId, input.connector)
  if (!record) {
    throw new Error(`Connector ${input.connector} not configured`)
  }

  const firstAsset = input.result.assets[0]
  let mediaAssetId: string | undefined

  if (firstAsset?.url || firstAsset?.buffer) {
    const media = await assetToMedia(
      firstAsset,
      input.uploaderId,
      input.workspaceId,
      input.kind
    )
    mediaAssetId = media?.id
  }

  const generatedAsset = await prisma.generatedAsset.create({
    data: {
      workspaceId: input.workspaceId,
      connector: input.connector,
      kind: input.kind,
      prompt: input.prompt,
      externalId: input.result.externalId,
      status: mediaAssetId ? "COMPLETED" : input.result.externalId ? "PENDING" : "FAILED",
      meta: input.meta as object | undefined,
      mediaAssetId,
      credentialId: record.id,
    },
  })

  return {
    generatedAssetId: generatedAsset.id,
    mediaAssetId,
    externalId: input.result.externalId,
    status: generatedAsset.status,
    publicUrl: firstAsset?.url,
  }
}

export async function attachMediaToPost(postId: string, mediaAssetId: string) {
  const existing = await prisma.postMedia.findFirst({
    where: { postId, mediaAssetId },
  })
  if (existing) return existing

  const count = await prisma.postMedia.count({ where: { postId } })
  return prisma.postMedia.create({
    data: { postId, mediaAssetId, sortOrder: count },
  })
}

export async function completePendingVideoAsset(
  generatedAssetId: string,
  result: ConnectorResult,
  uploaderId: string
) {
  const asset = await prisma.generatedAsset.findUnique({
    where: { id: generatedAssetId },
  })
  if (!asset || asset.status === "COMPLETED") return asset

  const first = result.assets[0]
  if (!first?.url && !first?.buffer) return asset

  const media = await assetToMedia(
    first,
    uploaderId,
    asset.workspaceId,
    asset.kind
  )
  if (!media) return asset

  const updated = await prisma.generatedAsset.update({
    where: { id: generatedAssetId },
    data: { status: "COMPLETED", mediaAssetId: media.id },
  })

  const postId = (asset.meta as { postId?: string } | null)?.postId
  if (postId) {
    await attachMediaToPost(postId, media.id)
  }

  return updated
}
