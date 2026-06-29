import { json } from "@/lib/api/response"
import {
  ApiAuthError,
  authenticateApiKey,
  requireScope,
  type ApiKeyContext,
} from "@/lib/api/authenticate"
import { assertApiAccess, PlanLimitError } from "@/lib/billing/subscription"
import type { ApiKeyScope } from "@/lib/api-keys/keys"

type Handler = (request: Request, context: ApiKeyContext) => Promise<Response>

export function withApiKey(scope: ApiKeyScope | null, handler: Handler) {
  return async (request: Request): Promise<Response> => {
    try {
      const context = await authenticateApiKey(request)
      await assertApiAccess(context.workspaceId)
      if (scope) {
        requireScope(context, scope)
      }
      return await handler(request, context)
    } catch (error) {
      if (error instanceof ApiAuthError) {
        return json({ error: error.message }, { status: error.status })
      }
      if (error instanceof PlanLimitError) {
        return json({ error: error.message }, { status: 402 })
      }
      return json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      )
    }
  }
}
