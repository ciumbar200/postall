import { AccountStatus } from "@/lib/domain/enums"
import { prisma } from "@/lib/db/client"
import { getPlatformAdapter } from "@/lib/platforms/registry"
import { createNotification } from "@/lib/notifications/service"
import { optionalEnv } from "@/lib/env"

const REFRESH_WINDOW_HOURS = 24

function appUrl(path: string) {
  const base = optionalEnv("APP_URL", "https://app.postall.app").replace(/\/$/, "")
  return `${base}${path}`
}

export async function refreshExpiringTokens() {
  const threshold = new Date(Date.now() + REFRESH_WINDOW_HOURS * 60 * 60 * 1000)

  const accounts = await prisma.socialAccount.findMany({
    where: {
      status: AccountStatus.CONNECTED,
      expiresAt: { not: null, lte: threshold },
    },
  })

  let refreshed = 0
  let expired = 0
  const errors: string[] = []

  for (const account of accounts) {
    let adapter
    try {
      adapter = getPlatformAdapter(account.platform)
    } catch {
      continue
    }

    if (!adapter.refresh) {
      continue
    }

    try {
      const result = await adapter.refresh({
        id: account.id,
        workspaceId: account.workspaceId,
        providerAccountId: account.providerAccountId,
        username: account.username,
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
        expiresAt: account.expiresAt,
        metadata: account.metadata as Record<string, unknown> | null,
      })

      await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken ?? account.refreshToken,
          expiresAt: result.expiresAt ?? account.expiresAt,
          scope: result.scope ?? account.scope,
          status: AccountStatus.CONNECTED,
          lastSyncedAt: new Date(),
          metadata: (result.metadata ?? account.metadata ?? undefined) as never,
        },
      })
      refreshed += 1
    } catch (error) {
      expired += 1
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${account.platform}/${account.username}: ${message}`)

      await prisma.socialAccount.update({
        where: { id: account.id },
        data: { status: AccountStatus.EXPIRED },
      })

      await createNotification({
        workspaceId: account.workspaceId,
        type: "TOKEN_EXPIRED",
        severity: "WARNING",
        title: `Reconecta tu cuenta de ${account.platform}`,
        body: `No pudimos renovar el acceso a @${account.username}. Vuelve a conectarla para seguir publicando.`,
        link: appUrl("/dashboard/accounts"),
        metadata: { accountId: account.id, error: message },
        email: true,
      })
    }
  }

  return { scanned: accounts.length, refreshed, expired, errors }
}
