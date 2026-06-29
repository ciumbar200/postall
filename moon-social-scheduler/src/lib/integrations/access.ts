import { WorkspaceRole } from "@/lib/domain/enums"
import { assertFeature, PlanLimitError } from "@/lib/billing/subscription"
import type { UserContext } from "@/lib/auth/session"

const ADMIN_ROLES = new Set<WorkspaceRole>([
  WorkspaceRole.OWNER,
  WorkspaceRole.ADMIN,
])

export async function assertCustomIntegrationsAccess(ctx: UserContext) {
  await assertFeature(ctx.workspaceId, "customIntegrations")
  if (!ADMIN_ROLES.has(ctx.role)) {
    throw new PlanLimitError("Solo administradores pueden gestionar credenciales personalizadas.")
  }
}
