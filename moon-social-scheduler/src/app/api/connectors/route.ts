import { json, errorJson } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { assertFeature, PlanLimitError } from "@/lib/billing/subscription"
import { ensureConnectorsLoaded } from "@/lib/connectors/registry"
import { isConfigured as checkConfigured } from "@/lib/connectors/credentials"
import { connectorGuides } from "@/lib/connectors/setup-guides"
import { isMissingTableError } from "@/lib/db/errors"

export const runtime = "nodejs"

export async function GET() {
  try {
    const { workspaceId } = await requireUserContext()
    await assertFeature(workspaceId, "connectors")
    await ensureConnectorsLoaded()

    const { listConnectors } = await import("@/lib/connectors/registry")
    const connectors = listConnectors()

    const status = await Promise.all(
      connectors.map(async (c) => ({
        type: c.type,
        name: c.name,
        capabilities: c.capabilities,
        configured: await checkConfigured(workspaceId, c.type),
        guide: connectorGuides[c.type],
      }))
    )

    return json({ connectors: status })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    if (error instanceof PlanLimitError) {
      return errorJson(error, 403)
    }
    if (isMissingTableError(error)) {
      await ensureConnectorsLoaded()
      const { listConnectors } = await import("@/lib/connectors/registry")
      const connectors = listConnectors()
      return json({
        connectors: connectors.map((c) => ({
          type: c.type,
          name: c.name,
          capabilities: c.capabilities,
          configured: false,
          guide: connectorGuides[c.type],
        })),
        migrationRequired: "006_brand_agent_connectors",
      })
    }
    return errorJson(error)
  }
}
