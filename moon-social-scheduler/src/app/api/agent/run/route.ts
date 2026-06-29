import { z } from "zod"
import { json, errorJson } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { Platform } from "@/generated/prisma/enums"
import { runBrandAgent } from "@/lib/agent/brand-agent"
import { assertFeature, PlanLimitError } from "@/lib/billing/subscription"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  brief: z.string().min(10),
  platforms: z.array(z.nativeEnum(Platform)).optional(),
  scheduleStart: z.string().datetime().optional(),
  horizonWeeks: z.union([z.literal(4), z.literal(12)]).optional(),
  postsPerWeek: z.number().int().min(1).max(14).optional(),
})

export async function POST(request: Request) {
  try {
    const { userId, workspaceId } = await requireUserContext()
    await assertFeature(workspaceId, "brandAgent")
    const input = schema.parse(await request.json())

    const result = await runBrandAgent({
      workspaceId,
      userId,
      brief: input.brief,
      platforms: input.platforms,
      scheduleStart: input.scheduleStart ? new Date(input.scheduleStart) : undefined,
      horizonWeeks: input.horizonWeeks,
      postsPerWeek: input.postsPerWeek,
    })

    return json(result)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    if (error instanceof PlanLimitError) {
      return errorJson(error, 403)
    }
    return errorJson(error)
  }
}
