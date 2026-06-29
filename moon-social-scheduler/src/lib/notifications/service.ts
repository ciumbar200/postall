import type {
  NotificationSeverity,
  NotificationType,
} from "@/lib/domain/enums"
import { prisma } from "@/lib/db/client"
import { hasEmailEnv, sendEmail } from "@/lib/notifications/email"

type CreateNotificationInput = {
  workspaceId: string
  type: NotificationType
  title: string
  body?: string | null
  link?: string | null
  severity?: NotificationSeverity
  metadata?: Record<string, unknown> | null
  /** When true, also delivers an email to workspace members. */
  email?: boolean
}

function renderEmailHtml(title: string, body?: string | null, link?: string | null) {
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:auto;">
      <h2 style="margin:0 0 12px;">${title}</h2>
      ${body ? `<p style="color:#444;line-height:1.5;">${body}</p>` : ""}
      ${
        link
          ? `<p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">Abrir Postall</a></p>`
          : ""
      }
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
      <p style="color:#888;font-size:12px;">Postall · gestiona tus avisos desde Ajustes.</p>
    </div>
  `
}

export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      workspaceId: input.workspaceId,
      type: input.type,
      severity: input.severity ?? "INFO",
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      metadata: (input.metadata ?? undefined) as never,
    },
  })

  if (input.email && hasEmailEnv()) {
    try {
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId: input.workspaceId, role: { in: ["OWNER", "ADMIN"] } },
        include: { user: true },
      })
      const recipients = members
        .map((member) => member.user.email)
        .filter((email): email is string => Boolean(email))

      if (recipients.length > 0) {
        await sendEmail({
          to: recipients,
          subject: input.title,
          html: renderEmailHtml(input.title, input.body, input.link),
        })
      }
    } catch (error) {
      console.error("Failed to send notification email", error)
    }
  }

  return notification
}
