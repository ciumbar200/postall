import { z } from "zod"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { isDatabaseConfigured } from "@/lib/db/runtime"
import { assertFeature, PlanLimitError } from "@/lib/billing/subscription"
import {
  generateWebhookSecret,
  WEBHOOK_EVENTS,
} from "@/lib/webhooks/deliver"

export const runtime = "nodejs"

export async function GET() {
  try {
    const { workspace } = await requireUserContext()
    const webhooks = await prisma.webhook.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    })

    return json({
      availableEvents: WEBHOOK_EVENTS,
      webhooks: webhooks.map((hook) => ({
        id: hook.id,
        url: hook.url,
        events: hook.events,
        active: hook.active,
        lastStatus: hook.lastStatus,
        lastDeliveredAt: hook.lastDeliveredAt?.toISOString() ?? null,
        createdAt: hook.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorJson(error, 401)
    if (isDatabaseConfigured()) return errorJson(error)
    return json({ availableEvents: WEBHOOK_EVENTS, webhooks: [] })
  }
}

const createSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).default([]),
})

export async function POST(request: Request) {
  try {
    const { workspace } = await requireUserContext()
    await assertFeature(workspace.id, "webhooks")
    const input = createSchema.parse(await request.json())

    const secret = generateWebhookSecret()
    const hook = await prisma.webhook.create({
      data: {
        workspaceId: workspace.id,
        url: input.url,
        events: input.events,
        secret,
      },
    })

    return json({ id: hook.id, url: hook.url, secret })
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
    await prisma.webhook.deleteMany({ where: { id, workspaceId: workspace.id } })
    return json({ ok: true })
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorJson(error, 401)
    return errorJson(error)
  }
}
