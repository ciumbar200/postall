import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { MediaType } from "@/generated/prisma/enums"
import { optionalEnv } from "@/lib/env"

const maxUploadBytes = 5 * 1024 * 1024 * 1024

export function mediaTypeFromMime(mimeType: string) {
  if (mimeType.startsWith("image/gif")) {
    return MediaType.GIF
  }

  if (mimeType.startsWith("image/")) {
    return MediaType.IMAGE
  }

  if (mimeType.startsWith("video/")) {
    return MediaType.VIDEO
  }

  throw new Error(`Unsupported media type: ${mimeType}`)
}

function extensionForFile(fileName: string) {
  const extension = path.extname(fileName)
  return extension || ".bin"
}

export async function persistLocalMedia(file: File) {
  if (file.size > maxUploadBytes) {
    throw new Error("Media files cannot exceed 5GB.")
  }

  const now = new Date()
  const folder = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
  const key = `${folder}/${randomUUID()}${extensionForFile(file.name)}`
  const outputDir = path.join(process.cwd(), "public", "uploads", folder)
  const outputPath = path.join(process.cwd(), "public", "uploads", key)

  await mkdir(outputDir, { recursive: true })
  await writeFile(outputPath, Buffer.from(await file.arrayBuffer()))

  const appUrl = optionalEnv("APP_URL", "http://localhost:3000")

  return {
    storageKey: key,
    publicUrl: `${appUrl}/uploads/${key}`,
    type: mediaTypeFromMime(file.type),
    mimeType: file.type || "application/octet-stream",
    byteSize: BigInt(file.size),
    fileName: file.name,
  }
}
