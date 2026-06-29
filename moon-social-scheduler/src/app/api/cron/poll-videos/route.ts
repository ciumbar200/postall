import { verifyCronSecret } from "@/lib/cron/verify-secret"
import { prisma } from "@/lib/db/client"
import { ensureConnectorsLoaded, getConnector } from "@/lib/connectors/registry"
import { getCredential } from "@/lib/connectors/credentials"
import { completePendingVideoAsset } from "@/lib/connectors/persist-asset"
import { AssetKind } from "@/generated/prisma/enums"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    await verifyCronSecret(request)

    const pendingAssets = await prisma.generatedAsset.findMany({
      where: {
        kind: AssetKind.VIDEO,
        status: "PENDING",
        externalId: { not: null },
      },
      include: {
        workspace: {
          include: {
            members: { orderBy: { createdAt: "asc" }, take: 1 },
          },
        },
      },
    })

    if (pendingAssets.length === 0) {
      return Response.json({ processed: 0, completed: 0 })
    }

    await ensureConnectorsLoaded()
    let completed = 0

    for (const asset of pendingAssets) {
      const connector = getConnector(asset.connector)
      if (!connector?.pollStatus || !asset.externalId) continue

      try {
        const cred = await getCredential(asset.workspaceId, asset.connector)
        if (!cred) continue

        const result = await connector.pollStatus(asset.externalId, cred)
        if (!result.assets[0]?.url && !result.assets[0]?.buffer) continue

        const uploaderId =
          asset.workspace.members[0]?.userId ?? asset.workspaceId

        await completePendingVideoAsset(asset.id, result, uploaderId)
        completed++
      } catch (error) {
        console.error(`Error polling video ${asset.id}:`, error)
      }
    }

    return Response.json({ processed: pendingAssets.length, completed })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 401 })
  }
}
