import { prisma } from "@/lib/db/client"
import { ConnectorType } from "@/generated/prisma/enums"
import {
  decryptCredentialPayload,
  encryptCredentialPayload,
  maskSecret,
  parseStoredCredential,
  serializeCredential,
} from "@/lib/crypto/credentials"
import type { AiProvider } from "@/lib/ai/provider"
import { optionalEnv } from "@/lib/env"
import {
  credentialsFromEnv,
  platformFromSlug,
  type PlatformAppCredentialPayload,
  type CredentialSource,
  type ResolvedPlatformAppCredentials,
} from "@/lib/integrations/platform-specs"
import type { PlatformSlug } from "@/lib/platforms/types"

export type ResolvedAiSettings = {
  provider: AiProvider
  model: string
  apiKey: string
  source: CredentialSource
  extras?: {
    httpReferer?: string
    appTitle?: string
    imageModel?: string
  }
}

const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-20241022",
  openrouter: "deepseek/deepseek-chat-v3-0324",
}

function hostedAiSettings(): ResolvedAiSettings | null {
  const provider = (process.env.AI_PROVIDER || "openai") as AiProvider
  const model = process.env.AI_MODEL || DEFAULT_MODELS[provider]

  let apiKey: string | undefined
  switch (provider) {
    case "openrouter":
      apiKey =
        process.env.OPENROUTER_API_KEY || process.env.AI_GATEWAY_API_KEY || undefined
      break
    case "anthropic":
      apiKey =
        process.env.ANTHROPIC_API_KEY || process.env.AI_GATEWAY_API_KEY || undefined
      break
    case "openai":
    default:
      apiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY || undefined
  }

  if (!apiKey) return null

  return {
    provider,
    model,
    apiKey,
    source: "hosted",
    extras: {
      httpReferer:
        process.env.OPENROUTER_HTTP_REFERER ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        undefined,
      appTitle: optionalEnv("OPENROUTER_APP_TITLE", "Postall"),
      imageModel: process.env.OPENAI_IMAGE_MODEL || "dall-e-3",
    },
  }
}

export async function resolvePlatformAppCredentials(
  workspaceId: string,
  slug: PlatformSlug
): Promise<ResolvedPlatformAppCredentials | null> {
  const platform = platformFromSlug(slug)

  try {
    const record = await prisma.platformAppCredential.findUnique({
      where: { workspaceId_platform: { workspaceId, platform } },
    })
    if (record?.status === "ACTIVE") {
      const cred = parseStoredCredential<PlatformAppCredentialPayload>(record.credentialsJson)
      if (cred?.clientId && cred?.clientSecret) {
        return { ...cred, source: "workspace" }
      }
    }
  } catch {
    // Table may not exist yet during migration rollout.
  }

  const hosted = credentialsFromEnv(slug)
  if (hosted) {
    return { ...hosted, source: "hosted" }
  }

  return null
}

export async function hasPlatformAppCredentials(
  workspaceId: string,
  slug: PlatformSlug
): Promise<boolean> {
  const resolved = await resolvePlatformAppCredentials(workspaceId, slug)
  return resolved !== null
}

export async function getPlatformCredentialSource(
  workspaceId: string,
  slug: PlatformSlug
): Promise<CredentialSource> {
  const resolved = await resolvePlatformAppCredentials(workspaceId, slug)
  return resolved?.source ?? "missing"
}

export async function setPlatformAppCredentials(
  workspaceId: string,
  slug: PlatformSlug,
  cred: PlatformAppCredentialPayload
): Promise<void> {
  const platform = platformFromSlug(slug)
  const payload = serializeCredential(cred)

  await prisma.platformAppCredential.upsert({
    where: { workspaceId_platform: { workspaceId, platform } },
    create: {
      workspaceId,
      platform,
      credentialsJson: payload,
      status: "ACTIVE",
    },
    update: {
      credentialsJson: payload,
      status: "ACTIVE",
      updatedAt: new Date(),
    },
  })
}

export async function deletePlatformAppCredentials(
  workspaceId: string,
  slug: PlatformSlug
): Promise<void> {
  const platform = platformFromSlug(slug)
  await prisma.platformAppCredential.deleteMany({
    where: { workspaceId, platform },
  })
}

export async function getMaskedPlatformAppCredentials(
  workspaceId: string,
  slug: PlatformSlug
) {
  const resolved = await resolvePlatformAppCredentials(workspaceId, slug)
  if (!resolved) {
    return {
      configured: false,
      source: "missing" as const,
      clientId: null,
      clientSecret: null,
    }
  }

  return {
    configured: true,
    source: resolved.source,
    clientId: maskSecret(resolved.clientId),
    clientSecret: maskSecret(resolved.clientSecret),
    hasCustomWorkspaceOverride: resolved.source === "workspace",
  }
}

export async function resolveAiSettings(
  workspaceId?: string
): Promise<ResolvedAiSettings | null> {
  if (workspaceId) {
    try {
      const record = await prisma.workspaceAiSettings.findUnique({
        where: { workspaceId },
      })
      if (record?.apiKey) {
        const apiKey = record.apiKey.includes(":")
          ? decryptCredentialPayload(record.apiKey)
          : record.apiKey
        const extras = (record.extrasJson ?? {}) as ResolvedAiSettings["extras"]
        return {
          provider: record.provider as AiProvider,
          model: record.model || DEFAULT_MODELS[record.provider as AiProvider],
          apiKey,
          source: "workspace",
          extras,
        }
      }
    } catch {
      // Table may not exist yet.
    }
  }

  return hostedAiSettings()
}

export async function setWorkspaceAiSettings(
  workspaceId: string,
  input: {
    provider: AiProvider
    model?: string
    apiKey: string
    extras?: ResolvedAiSettings["extras"]
  }
): Promise<void> {
  const encryptedKey = encryptCredentialPayload(input.apiKey)

  await prisma.workspaceAiSettings.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      provider: input.provider,
      model: input.model ?? DEFAULT_MODELS[input.provider],
      apiKey: encryptedKey,
      extrasJson: input.extras ?? undefined,
    },
    update: {
      provider: input.provider,
      model: input.model ?? DEFAULT_MODELS[input.provider],
      apiKey: encryptedKey,
      extrasJson: input.extras ?? undefined,
      updatedAt: new Date(),
    },
  })
}

export async function deleteWorkspaceAiSettings(workspaceId: string): Promise<void> {
  await prisma.workspaceAiSettings.deleteMany({ where: { workspaceId } })
}

export async function getMaskedAiSettings(workspaceId: string) {
  const workspaceRecord = await prisma.workspaceAiSettings
    .findUnique({ where: { workspaceId } })
    .catch(() => null)

  const hosted = hostedAiSettings()

  if (workspaceRecord?.apiKey) {
    const decrypted = workspaceRecord.apiKey.includes(":")
      ? decryptCredentialPayload(workspaceRecord.apiKey)
      : workspaceRecord.apiKey
    return {
      configured: true,
      source: "workspace" as const,
      provider: workspaceRecord.provider as AiProvider,
      model: workspaceRecord.model,
      apiKey: maskSecret(decrypted),
      hasCustomOverride: true,
      hostedAvailable: Boolean(hosted),
    }
  }

  if (hosted) {
    return {
      configured: true,
      source: "hosted" as const,
      provider: hosted.provider,
      model: hosted.model,
      apiKey: null,
      hasCustomOverride: false,
      hostedAvailable: true,
    }
  }

  return {
    configured: false,
    source: "missing" as const,
    provider: (process.env.AI_PROVIDER || "openrouter") as AiProvider,
    model: null,
    apiKey: null,
    hasCustomOverride: false,
    hostedAvailable: false,
  }
}

export type CanvaAppCredentials = {
  clientId: string
  clientSecret: string
  source: CredentialSource
}

export async function resolveCanvaAppCredentials(
  workspaceId: string
): Promise<CanvaAppCredentials | null> {
  try {
    const record = await prisma.connectorCredential.findUnique({
      where: {
        workspaceId_connector: { workspaceId, connector: ConnectorType.CANVA },
      },
    })
    if (record) {
      const cred = parseStoredCredential<{
        clientId?: string
        clientSecret?: string
        accessToken?: string
      }>(record.credentialsJson)
      if (cred?.clientId && cred?.clientSecret) {
        return {
          clientId: cred.clientId,
          clientSecret: cred.clientSecret,
          source: "workspace",
        }
      }
    }
  } catch {
    // ignore
  }

  const clientId = process.env.CANVA_CLIENT_ID?.trim()
  const clientSecret = process.env.CANVA_CLIENT_SECRET?.trim()
  if (clientId && clientSecret) {
    return { clientId, clientSecret, source: "hosted" }
  }

  return null
}
