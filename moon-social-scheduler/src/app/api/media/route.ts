import { errorJson, json } from "@/lib/api/response"
import { addMedia, listMedia } from "@/lib/local-dev/store"
import { persistLocalMedia } from "@/lib/storage/local"

export const runtime = "nodejs"

export async function GET() {
  try {
    return json({ assets: listMedia() })
  } catch (error) {
    return errorJson(error)
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return errorJson(new Error("Expected multipart field `file`."), 400)
    }

    const stored = await persistLocalMedia(file)
    const asset = addMedia({
      type: stored.type,
      fileName: stored.fileName,
      mimeType: stored.mimeType,
      byteSize: String(stored.byteSize),
      publicUrl: stored.publicUrl,
    })

    return json({ asset }, { status: 201 })
  } catch (error) {
    return errorJson(error)
  }
}
