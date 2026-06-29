import { json } from "@/lib/api/response"
import { authenticateApiKey, ApiAuthError, requireScope } from "@/lib/api/authenticate"
import { assertApiAccess, PlanLimitError } from "@/lib/billing/subscription"
import { getPostStatusForWorkspace } from "@/lib/posts/service"

export const runtime = "nodejs"

export async function GET(
  request: Request,
  context: RouteContext<"/api/v1/posts/[id]">
) {
  try {
    const auth = await authenticateApiKey(request)
    await assertApiAccess(auth.workspaceId)
    requireScope(auth, "posts:read")

    const { id } = await context.params
    const status = await getPostStatusForWorkspace(auth.workspaceId, id)

    if (!status) {
      return json({ error: "Post not found" }, { status: 404 })
    }

    return json({ post: status })
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
