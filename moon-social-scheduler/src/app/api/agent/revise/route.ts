import { z } from "zod"
import { json, errorJson } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { reviseContentStrategy } from "@/lib/agent/strategy-reviser"
import { assertFeature, PlanLimitError } from "@/lib/billing/subscription"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  lookbackDays: z.number().int().min(7).max(90).optional(),
})

export async function POST(request: Request) {
  try {
    const { workspaceId } = await requireUserContext()
    await assertFeature(workspaceId, "brandAgent")
    const input = schema.parse(await request.json().catch(() => ({})))

    const result = await reviseContentStrategy({
      workspaceId,
      lookbackDays: input.lookbackDays,
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
