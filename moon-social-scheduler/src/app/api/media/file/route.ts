import { readFile } from "node:fs/promises"
import path from "node:path"
import { optionalEnv } from "@/lib/env"
import {
  hasSupabaseStorageEnv,
  supabaseServiceRoleKey,
} from "@/lib/storage/supabase"

export const runtime = "nodejs"

function contentTypeForKey(key: string) {
  const extension = path.extname(key).toLowerCase()

  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg"
    case ".png":
      return "image/png"
    case ".gif":
      return "image/gif"
    case ".webp":
      return "image/webp"
    case ".mp4":
      return "video/mp4"
    case ".mov":
      return "video/quicktime"
    case ".webm":
      return "video/webm"
    default:
      return "application/octet-stream"
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")

  if (!key || key.includes("..")) {
    return new Response("Invalid media key.", { status: 400 })
  }

  if (hasSupabaseStorageEnv()) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = supabaseServiceRoleKey()
    const bucket = optionalEnv("SUPABASE_STORAGE_BUCKET", "media")
    const fileUrl = `${supabaseUrl!.replace(/\/$/, "")}/storage/v1/object/${bucket}/${key}`

    const response = await fetch(fileUrl, {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    })

    if (!response.ok) {
      return new Response("Media not found.", { status: 404 })
    }

    const body = await response.arrayBuffer()

    return new Response(body, {
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || contentTypeForKey(key),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  }

  try {
    const filePath = path.join(process.cwd(), "public", "uploads", key)
    const body = await readFile(filePath)

    return new Response(body, {
      headers: {
        "Content-Type": contentTypeForKey(key),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return new Response("Media not found.", { status: 404 })
  }
}
