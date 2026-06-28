import { randomUUID } from "node:crypto"
import path from "node:path"
import { optionalEnv } from "@/lib/env"
import { mediaTypeFromMime } from "@/lib/storage/local"

const maxUploadBytes = 5 * 1024 * 1024 * 1024

function extensionForFile(fileName: string) {
  const extension = path.extname(fileName)
  return extension || ".bin"
}

function supabaseServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ""
  )
}

export { supabaseServiceRoleKey }

function mediaFileUrl(key: string) {
  return `/api/media/file?key=${encodeURIComponent(key)}`
}

export function hasSupabaseStorageEnv() {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      supabaseServiceRoleKey()
  )
}

export async function persistSupabaseMedia(file: File) {
  if (file.size > maxUploadBytes) {
    throw new Error("Media files cannot exceed 5GB.")
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = supabaseServiceRoleKey()
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase storage environment variables.")
  }
  const bucket = optionalEnv("SUPABASE_STORAGE_BUCKET", "media")
  const now = new Date()
  const folder = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
  const key = `${folder}/${randomUUID()}${extensionForFile(file.name)}`

  const uploadUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${bucket}/${key}`
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "x-upsert": "false",
      "Content-Type": file.type || "application/octet-stream",
    },
    body: Buffer.from(await file.arrayBuffer()),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Supabase storage upload failed: ${response.status} ${body}`)
  }

  return {
    storageKey: key,
    publicUrl: mediaFileUrl(key),
    type: mediaTypeFromMime(file.type),
    mimeType: file.type || "application/octet-stream",
    byteSize: BigInt(file.size),
    fileName: file.name,
  }
}
