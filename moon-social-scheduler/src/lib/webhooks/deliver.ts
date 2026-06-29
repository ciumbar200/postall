import { createHmac, randomBytes } from "node:crypto"
import { prisma } from "@/lib/db/client"

export const WEBHOOK_EVENTS = [
  "post.scheduled",
  "post.published",
  "post.failed",
  "account.expired",
] as const

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("hex")}`
}

function sign(secret: string, payload: string, timestamp: number): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex")
}

/**
 * Fire-and-forget delivery of an event to all active webhooks of a workspace.
 * Signed with HMAC-SHA256 in the `Postall-Signature` header (`t=<ts>,v1=<sig>`).
 */
export async function dispatchWebhook(
  workspaceId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  let hooks
  try {
    hooks = await prisma.webhook.findMany({
      where: { workspaceId, active: true },
    })
  } catch {
    return
  }

  const relevant = hooks.filter(
    (hook) => hook.events.length === 0 || hook.events.includes(event)
  )
  if (relevant.length === 0) return

  const timestamp = Math.floor(Date.now() / 1000)
  const body = JSON.stringify({ event, data, timestamp })

  await Promise.allSettled(
    relevant.map(async (hook) => {
      const signature = sign(hook.secret, body, timestamp)
      try {
        const response = await fetch(hook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Postall-Event": event,
            "Postall-Signature": `t=${timestamp},v1=${signature}`,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        })
        await prisma.webhook.update({
          where: { id: hook.id },
          data: { lastStatus: response.status, lastDeliveredAt: new Date() },
        })
      } catch {
        await prisma.webhook
          .update({ where: { id: hook.id }, data: { lastStatus: 0, lastDeliveredAt: new Date() } })
          .catch(() => undefined)
      }
    })
  )
}
