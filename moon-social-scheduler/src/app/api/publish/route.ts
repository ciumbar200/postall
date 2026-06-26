import { z } from "zod"
import { errorJson, json } from "@/lib/api/response"
import { publishPost } from "@/lib/local-dev/store"

const publishNowSchema = z.object({
  postId: z.string(),
})

export async function POST(request: Request) {
  try {
    const { postId } = publishNowSchema.parse(await request.json())
    const publishJob = publishPost(postId)

    if (!publishJob) {
      return errorJson(new Error("Post not found."), 404)
    }

    return json({ publishJob }, { status: 202 })
  } catch (error) {
    return errorJson(error)
  }
}
