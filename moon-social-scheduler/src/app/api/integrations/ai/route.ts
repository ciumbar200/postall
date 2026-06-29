import { z } from "zod"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { PlanLimitError } from "@/lib/billing/subscription"
import type { AiProvider } from "@/lib/ai/provider"
import { assertCustomIntegrationsAccess } from "@/lib/integrations/access"
import {
  deleteWorkspaceAiSettings,
  getMaskedAiSettings,
  setWorkspaceAiSettings,
} from "@/lib/integrations/resolve"
import { hasFeature } from "@/lib/billing/subscription"

export const runtime = "nodejs"

const putSchema = z.object({
  provider: z.enum(["openai", "anthropic", "openrouter"]),
  model: z.string().optional(),
  apiKey: z.string().min(1),
  extras: z
    .object({
      httpReferer: z.string().optional(),
      appTitle: z.string().optional(),
      imageModel: z.string().optional(),
    })
    .optional(),
})

export async function GET() {
  try {
    const { workspaceId } = await requireUserContext()
    const settings = await getMaskedAiSettings(workspaceId)
    const canUseCustomCredentials = await hasFeature(
      workspaceId,
      "customIntegrations"
    )

    return json({
      ...settings,
      canUseCustomCredentials,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    return errorJson(error)
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await requireUserContext()
    await assertCustomIntegrationsAccess(ctx)
    const input = putSchema.parse(await request.json())

    await setWorkspaceAiSettings(ctx.workspaceId, {
      provider: input.provider as AiProvider,
      model: input.model,
      apiKey: input.apiKey,
      extras: input.extras,
    })

    return json({ success: true })
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

export async function DELETE() {
  try {
    const ctx = await requireUserContext()
    await assertCustomIntegrationsAccess(ctx)
    await deleteWorkspaceAiSettings(ctx.workspaceId)
    return json({ success: true })
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
