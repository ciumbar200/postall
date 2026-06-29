import { errorJson, json } from "@/lib/api/response"
import { isAuthorizedCron } from "@/lib/cron/auth"
import { prisma } from "@/lib/db/client"
import { createNotification } from "@/lib/notifications/service"
import { optionalEnv } from "@/lib/env"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return errorJson(new Error("Unauthorized"), 401)
  }

  try {
    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const base = optionalEnv("APP_URL", "https://app.postall.app").replace(/\/$/, "")

    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: { in: ["ACTIVE", "TRIALING"] },
        cancelAtPeriodEnd: false,
        currentPeriodEnd: { gte: now, lte: in7Days },
        OR: [
          { renewalNotifiedAt: null },
          { renewalNotifiedAt: { lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } },
        ],
      },
    })

    let notified = 0
    for (const subscription of subscriptions) {
      const renewDate = subscription.currentPeriodEnd?.toLocaleDateString() ?? "pronto"
      await createNotification({
        workspaceId: subscription.workspaceId,
        type: "RENEWAL_REMINDER",
        severity: "INFO",
        title: `Tu plan ${subscription.tier} se renueva el ${renewDate}`,
        body: "Puedes gestionar o cancelar tu suscripción desde cualquier dispositivo, sin permanencia.",
        link: `${base}/dashboard/billing`,
        email: true,
      })
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { renewalNotifiedAt: now },
      })
      notified += 1
    }

    return json({ ok: true, scanned: subscriptions.length, notified })
  } catch (error) {
    return errorJson(error)
  }
}

export async function POST(request: Request) {
  return GET(request)
}
