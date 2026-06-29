import { z } from "zod"
import { json } from "@/lib/api/response"
import { withApiKey } from "@/lib/api/v1"
import { prisma } from "@/lib/db/client"

export const runtime = "nodejs"

const schema = z.object({
  url: z.string().url(),
  fileName: z.string().default("media"),
  mimeType: z.string().default("application/octet-stream"),
  type: z.enum(["IMAGE", "GIF", "VIDEO"]).optional(),
  byteSize: z.number().int().nonnegative().default(0),
  altText: z.string().optional(),
})

function inferType(mimeType: string): "IMAGE" | "GIF" | "VIDEO" {
  if (mimeType.startsWith("video/")) return "VIDEO"
  if (mimeType === "image/gif") return "GIF"
  return "IMAGE"
}

export const GET = withApiKey("posts:read", async (_request, context) => {
  const assets = await prisma.mediaAsset.findMany({
    where: { workspaceId: context.workspaceId },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return json({
    assets: assets.map((asset) => ({
      id: asset.id,
      type: asset.type,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      publicUrl: asset.publicUrl,
    })),
  })
})

export const POST = withApiKey("media:write", async (request, context) => {
  const input = schema.parse(await request.json())

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId: context.workspaceId },
    orderBy: { createdAt: "asc" },
  })
  if (!member) {
    return json({ error: "Workspace has no members" }, { status: 400 })
  }

  const type = input.type ?? inferType(input.mimeType)

  const asset = await prisma.mediaAsset.create({
    data: {
      workspaceId: context.workspaceId,
      uploaderId: member.userId,
      type,
      fileName: input.fileName,
      mimeType: input.mimeType,
      byteSize: BigInt(input.byteSize),
      storageKey: `external/${input.url}`,
      publicUrl: input.url,
      altText: input.altText ?? null,
    },
  })

  return json(
    {
      id: asset.id,
      type: asset.type,
      fileName: asset.fileName,
      publicUrl: asset.publicUrl,
    },
    { status: 201 }
  )
})
