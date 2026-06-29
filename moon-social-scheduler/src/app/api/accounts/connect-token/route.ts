import { z } from "zod"
import { Platform } from "@/lib/domain/enums"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { isDatabaseConfigured } from "@/lib/db/runtime"
import { assertCanConnectChannel, PlanLimitError } from "@/lib/billing/subscription"

export const runtime = "nodejs"

const blueskySchema = z.object({
  platform: z.literal("bluesky"),
  handle: z.string().min(1),
  appPassword: z.string().min(1),
  pds: z.string().url().optional(),
})

const telegramSchema = z.object({
  platform: z.literal("telegram"),
  botToken: z.string().min(1),
  chatId: z.string().min(1),
  displayName: z.string().optional(),
})

const schema = z.discriminatedUnion("platform", [blueskySchema, telegramSchema])

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return errorJson(new Error("Base de datos no configurada."), 503)
  }

  try {
    const { workspace } = await requireUserContext()
    await assertCanConnectChannel(workspace.id)
    const input = schema.parse(await request.json())

    if (input.platform === "bluesky") {
      const pds = input.pds ?? "https://bsky.social"
      const response = await fetch(`${pds}/xrpc/com.atproto.server.createSession`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: input.handle, password: input.appPassword }),
      })
      const data = (await response.json().catch(() => ({}))) as {
        did?: string
        handle?: string
        accessJwt?: string
        message?: string
      }
      if (!response.ok || !data.did || !data.accessJwt) {
        throw new Error(data.message ?? "Credenciales de Bluesky inválidas")
      }

      await prisma.socialAccount.upsert({
        where: {
          workspaceId_platform_providerAccountId: {
            workspaceId: workspace.id,
            platform: Platform.BLUESKY,
            providerAccountId: data.did,
          },
        },
        update: {
          username: data.handle ?? input.handle,
          displayName: data.handle ?? input.handle,
          status: "CONNECTED",
          accessToken: input.appPassword,
          refreshToken: data.accessJwt,
          metadata: { pds },
          disconnectedAt: null,
          lastSyncedAt: new Date(),
        },
        create: {
          workspaceId: workspace.id,
          platform: Platform.BLUESKY,
          providerAccountId: data.did,
          username: data.handle ?? input.handle,
          displayName: data.handle ?? input.handle,
          status: "CONNECTED",
          accessToken: input.appPassword,
          refreshToken: data.accessJwt,
          metadata: { pds },
          lastSyncedAt: new Date(),
        },
      })

      return json({ ok: true, platform: "bluesky" })
    }

    const verify = await fetch(
      `https://api.telegram.org/bot${input.botToken}/getChat?chat_id=${encodeURIComponent(input.chatId)}`
    )
    const chat = (await verify.json().catch(() => ({}))) as {
      ok?: boolean
      result?: { title?: string; username?: string; id?: number }
      description?: string
    }
    if (!verify.ok || !chat.ok) {
      throw new Error(chat.description ?? "Token o chat ID de Telegram inválidos")
    }

    const providerAccountId = String(chat.result?.id ?? input.chatId)
    const username = chat.result?.username ?? input.chatId

    await prisma.socialAccount.upsert({
      where: {
        workspaceId_platform_providerAccountId: {
          workspaceId: workspace.id,
          platform: Platform.TELEGRAM,
          providerAccountId,
        },
      },
      update: {
        username,
        displayName: input.displayName ?? chat.result?.title ?? username,
        status: "CONNECTED",
        accessToken: input.botToken,
        metadata: { chatId: input.chatId },
        disconnectedAt: null,
        lastSyncedAt: new Date(),
      },
      create: {
        workspaceId: workspace.id,
        platform: Platform.TELEGRAM,
        providerAccountId,
        username,
        displayName: input.displayName ?? chat.result?.title ?? username,
        status: "CONNECTED",
        accessToken: input.botToken,
        metadata: { chatId: input.chatId },
        lastSyncedAt: new Date(),
      },
    })

    return json({ ok: true, platform: "telegram" })
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorJson(error, 401)
    if (error instanceof PlanLimitError) return errorJson(error, 402)
    return errorJson(error)
  }
}
