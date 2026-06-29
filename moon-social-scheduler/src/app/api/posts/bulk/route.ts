import { z } from "zod"
import { Platform } from "@/lib/domain/enums"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { createPostForWorkspace } from "@/lib/posts/service"
import { PlanLimitError } from "@/lib/billing/subscription"

export const runtime = "nodejs"

const postSchema = z.object({
  text: z.string().min(1),
  scheduledAt: z.string().datetime().optional().nullable(),
  timezone: z.string().default("UTC"),
  targetAccountIds: z.array(z.string()).default([]),
  mediaAssetIds: z.array(z.string()).default([]),
  versions: z
    .array(
      z.object({
        platform: z.enum(Object.values(Platform) as [Platform, ...Platform[]]),
        text: z.string().min(1),
        settings: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .default([]),
})

const schema = z.object({ posts: z.array(postSchema).min(1).max(100) })

export async function POST(request: Request) {
  try {
    const { user, workspace } = await requireUserContext()
    const { posts } = schema.parse(await request.json())

    const results: Array<{ ok: boolean; id?: string; error?: string }> = []

    for (const item of posts) {
      try {
        const { post } = await createPostForWorkspace(workspace.id, user.id, {
          baseText: item.text,
          scheduledAt: item.scheduledAt,
          timezone: item.timezone,
          targetAccountIds: item.targetAccountIds,
          mediaAssetIds: item.mediaAssetIds,
          versions: item.versions,
        })
        results.push({ ok: true, id: post.id })
      } catch (error) {
        if (error instanceof PlanLimitError) {
          results.push({ ok: false, error: error.message })
          break
        }
        results.push({ ok: false, error: error instanceof Error ? error.message : "error" })
      }
    }

    return json({
      created: results.filter((result) => result.ok).length,
      total: posts.length,
      results,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    return errorJson(error)
  }
}
