import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { mediaTypeFromMime } from "@/lib/storage/local"
import { hasSupabaseStorageEnv, supabaseServiceRoleKey } from "@/lib/storage/supabase"
import { optionalEnv } from "@/lib/env"
import { MediaType } from "@/lib/domain/enums"

function extensionForMime(mimeType: string, fileName?: string) {
  if (fileName) {
    const ext = path.extname(fileName)
    if (ext) return ext
  }
  if (mimeType === "image/png") return ".png"
  if (mimeType === "image/jpeg") return ".jpg"
  if (mimeType === "video/mp4") return ".mp4"
  return ".bin"
}

function mediaFileUrl(key: string) {
  return `/api/media/file?key=${encodeURIComponent(key)}`
}

export async function persistBufferMedia(options: {
  buffer: Buffer
  fileName: string
  mimeType: string
}) {
  const { buffer, fileName, mimeType } = options
  const now = new Date()
  const folder = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
  const key = `${folder}/${randomUUID()}${extensionForMime(mimeType, fileName)}`

  if (hasSupabaseStorageEnv()) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = supabaseServiceRoleKey()
    const bucket = optionalEnv("SUPABASE_STORAGE_BUCKET", "media")
    const uploadUrl = `${supabaseUrl!.replace(/\/$/, "")}/storage/v1/object/${bucket}/${key}`

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "x-upsert": "false",
        "Content-Type": mimeType,
      },
      body: buffer,
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Supabase storage upload failed: ${response.status} ${body}`)
    }

    return {
      storageKey: key,
      publicUrl: mediaFileUrl(key),
      type: mediaTypeFromMime(mimeType) as MediaType,
      mimeType,
      byteSize: BigInt(buffer.byteLength),
      fileName,
    }
  }

  const outputDir = path.join(process.cwd(), "public", "uploads", folder)
  const outputPath = path.join(process.cwd(), "public", "uploads", key)
  await mkdir(outputDir, { recursive: true })
  await writeFile(outputPath, buffer)

  return {
    storageKey: key,
    publicUrl: `/uploads/${key}`,
    type: mediaTypeFromMime(mimeType) as MediaType,
    mimeType,
    byteSize: BigInt(buffer.byteLength),
    fileName,
  }
}

export async function persistUrlMedia(options: {
  url: string
  fileName: string
  mimeType: string
}) {
  const response = await fetch(options.url)
  if (!response.ok) {
    throw new Error(`Failed to fetch media URL: ${response.status}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  return persistBufferMedia({
    buffer,
    fileName: options.fileName,
    mimeType: options.mimeType,
  })
}
