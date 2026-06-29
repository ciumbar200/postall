import { z } from "zod"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { isMissingTableError } from "@/lib/db/errors"
import { API_KEY_SCOPES, generateApiKey } from "@/lib/api-keys/keys"
import { assertApiAccess, PlanLimitError } from "@/lib/billing/subscription"

export const runtime = "nodejs"

export async function GET() {
  try {
    const { workspace } = await requireUserContext()
    const keys = await prisma.apiKey.findMany({
      where: { workspaceId: workspace.id, revokedAt: null },
      orderBy: { createdAt: "desc" },
    })

    return json({
      keys: keys.map((key) => ({
        id: key.id,
        name: key.name,
        prefix: key.prefix,
        scopes: key.scopes,
        rateLimitPerMin: key.rateLimitPerMin,
        lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
        createdAt: key.createdAt.toISOString(),
      })),
      availableScopes: API_KEY_SCOPES,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorJson(error, 401)
    if (isMissingTableError(error, "ApiKey")) {
      return json({
        keys: [],
        availableScopes: API_KEY_SCOPES,
        migrationRequired: "004_billing_apikeys_notifications",
      })
    }
    return errorJson(error)
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(60),
  scopes: z.array(z.enum(API_KEY_SCOPES)).default([]),
  rateLimitPerMin: z.number().int().min(1).max(600).default(60),
})

export async function POST(request: Request) {
  try {
    const { workspace } = await requireUserContext()
    await assertApiAccess(workspace.id)

    const input = createSchema.parse(await request.json())
    const generated = generateApiKey()

    const key = await prisma.apiKey.create({
      data: {
        workspaceId: workspace.id,
        name: input.name,
        prefix: generated.prefix,
        hashedKey: generated.hashedKey,
        scopes: input.scopes,
        rateLimitPerMin: input.rateLimitPerMin,
      },
    })

    // The full key is only returned once.
    return json(
      {
        id: key.id,
        name: key.name,
        prefix: key.prefix,
        scopes: key.scopes,
        fullKey: generated.fullKey,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorJson(error, 401)
    if (error instanceof PlanLimitError) return errorJson(error, 402)
    return errorJson(error)
  }
}

const deleteSchema = z.object({ id: z.string() })

export async function DELETE(request: Request) {
  try {
    const { workspace } = await requireUserContext()
    const { id } = deleteSchema.parse(await request.json())

    await prisma.apiKey.updateMany({
      where: { id, workspaceId: workspace.id },
      data: { revokedAt: new Date() },
    })

    return json({ ok: true })
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorJson(error, 401)
    return errorJson(error)
  }
}
