import { z } from "zod"
import { errorJson, json } from "@/lib/api/response"
import { updatePost } from "@/lib/local-dev/store"

const updatePostSchema = z.object({
  scheduledAt: z.string().datetime().nullable().optional(),
  baseText: z.string().min(1).optional(),
})

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/posts/[id]">
) {
  try {
    const { id } = await context.params
    const input = updatePostSchema.parse(await request.json())
    const post = updatePost(id, input)

    if (!post) {
      return errorJson(new Error("Post not found."), 404)
    }

    return json({ post, publishJob: null })
  } catch (error) {
    return errorJson(error)
  }
}
