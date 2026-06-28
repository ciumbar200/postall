import { errorJson, json } from "@/lib/api/response"
import { getCurrentUserContext } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { addMedia, listMedia } from "@/lib/local-dev/store"
import { persistLocalMedia } from "@/lib/storage/local"
import { hasSupabaseStorageEnv, persistSupabaseMedia } from "@/lib/storage/supabase"

export const runtime = "nodejs"

function serializeAsset(asset: {
  id: string
  type: string
  fileName: string
  mimeType: string
  byteSize: bigint | string | number
  storageKey?: string | null
  publicUrl: string
  createdAt: Date | string
}) {
  const publicUrl = asset.storageKey
    ? `/api/media/file?key=${encodeURIComponent(asset.storageKey)}`
    : asset.publicUrl

  return {
    id: asset.id,
    type: asset.type,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    byteSize: String(asset.byteSize),
    publicUrl,
    createdAt:
      asset.createdAt instanceof Date
        ? asset.createdAt.toISOString()
        : asset.createdAt,
  }
}

export async function GET() {
  try {
    const { workspace } = await getCurrentUserContext()
    const assets = await prisma.mediaAsset.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    })

    if (assets.length > 0) {
      return json({
        assets: assets.map((asset) => serializeAsset(asset)),
      })
    }

    return json({ assets: listMedia() })
  } catch (error) {
    return json({ assets: listMedia() })
  }
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return errorJson(new Error("Expected multipart field `file`."), 400)
  }

  try {
    const stored = hasSupabaseStorageEnv()
      ? await persistSupabaseMedia(file)
      : await persistLocalMedia(file)

    try {
      const { user, workspace } = await getCurrentUserContext()
      const asset = await prisma.mediaAsset.create({
        data: {
          workspaceId: workspace.id,
          uploaderId: user.id,
          type: stored.type,
          fileName: stored.fileName,
          mimeType: stored.mimeType,
          byteSize: stored.byteSize,
          storageKey: stored.storageKey,
          publicUrl: stored.publicUrl,
        },
      })

      return json({ asset: serializeAsset(asset) }, { status: 201 })
    } catch {
      const asset = addMedia({
        type: stored.type,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        byteSize: String(stored.byteSize),
        publicUrl: stored.publicUrl,
      })

      return json(
        {
          asset: serializeAsset({
            ...asset,
            storageKey: stored.storageKey,
            byteSize: asset.byteSize,
            createdAt: asset.createdAt,
          }),
        },
        { status: 201 }
      )
    }
  } catch (error) {
    return errorJson(error)
  }
}
