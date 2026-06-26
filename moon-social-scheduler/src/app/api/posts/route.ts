import { z } from "zod"
import { errorJson, json } from "@/lib/api/response"
import { createPost, listPosts } from "@/lib/local-dev/store"

const createPostSchema = z.object({
  baseText: z.string().min(1),
  scheduledAt: z.string().datetime().optional().nullable(),
  timezone: z.string().default("UTC"),
  mediaAssetIds: z.array(z.string()).default([]),
  targetAccountIds: z.array(z.string()).default([]),
  versions: z.array(z.unknown()).default([]),
  publishNow: z.boolean().default(false),
})

export async function GET() {
  try {
    return json({ posts: listPosts() })
  } catch (error) {
    return errorJson(error)
  }
}

export async function POST(request: Request) {
  try {
    const input = createPostSchema.parse(await request.json())
    const post = createPost({
      baseText: input.baseText,
      scheduledAt: input.publishNow ? new Date().toISOString() : input.scheduledAt,
      timezone: input.timezone,
      targetAccountIds: input.targetAccountIds,
      mediaAssetIds: input.mediaAssetIds,
    })

    return json({ post, publishJob: null }, { status: 201 })
  } catch (error) {
    return errorJson(error)
  }
}
