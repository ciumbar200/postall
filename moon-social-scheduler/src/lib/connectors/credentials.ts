import { prisma } from "@/lib/db/client"
import { ConnectorType } from "@/generated/prisma/enums"
import {
  parseStoredCredential,
  serializeCredential,
} from "@/lib/crypto/credentials"
import type { Credential } from "./types"

const ENV_KEYS: Partial<Record<ConnectorType, string>> = {
  IMAGE_GEN: "OPENAI_API_KEY",
  HEYGEN: "HEYGEN_API_KEY",
  FLIKI: "FLIKI_API_KEY",
}

function credentialFromEnv(connector: ConnectorType): Credential | null {
  const envKey = ENV_KEYS[connector]
  if (!envKey) return null
  const apiKey = process.env[envKey]?.trim()
  if (!apiKey) return null

  const cred: Credential = { apiKey }
  if (connector === ConnectorType.HEYGEN) {
    const avatarId = process.env.HEYGEN_DEFAULT_AVATAR_ID?.trim()
    const voiceId = process.env.HEYGEN_DEFAULT_VOICE_ID?.trim()
    if (avatarId) cred.avatarId = avatarId
    if (voiceId) cred.voiceId = voiceId
  }
  if (connector === ConnectorType.IMAGE_GEN) {
    const model = process.env.OPENAI_IMAGE_MODEL?.trim()
    if (model) cred.imageModel = model
  }
  return cred
}

export async function getCredentialRecord(
  workspaceId: string,
  connector: ConnectorType
) {
  const record = await prisma.connectorCredential.findUnique({
    where: { workspaceId_connector: { workspaceId, connector } },
  })
  if (record) {
    const cred = parseStoredCredential<Credential>(record.credentialsJson)
    if (cred) return { id: record.id, cred, source: "workspace" as const }
  }

  const envCred = credentialFromEnv(connector)
  if (!envCred) return null
  return { id: null, cred: envCred, source: "env" as const }
}

export async function getCredential(
  workspaceId: string,
  connector: ConnectorType
): Promise<Credential | null> {
  const record = await getCredentialRecord(workspaceId, connector)
  return record?.cred ?? null
}

export async function setCredential(
  workspaceId: string,
  connector: ConnectorType,
  cred: Credential
): Promise<void> {
  const existing = await getCredential(workspaceId, connector)
  const merged = { ...(existing ?? {}), ...cred }
  const payload = serializeCredential(merged)

  await prisma.connectorCredential.upsert({
    where: { workspaceId_connector: { workspaceId, connector } },
    create: {
      workspaceId,
      connector,
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

export async function deleteCredential(
  workspaceId: string,
  connector: ConnectorType
): Promise<void> {
  await prisma.connectorCredential.deleteMany({
    where: { workspaceId, connector },
  })
}

export async function isConfigured(
  workspaceId: string,
  connector: ConnectorType
): Promise<boolean> {
  const record = await prisma.connectorCredential.findUnique({
    where: { workspaceId_connector: { workspaceId, connector } },
  })
  if (record?.status === "ACTIVE") {
    const cred = parseStoredCredential<Credential>(record.credentialsJson)
    if (connector === ConnectorType.CANVA) {
      return Boolean(cred?.accessToken)
    }
    return Boolean(cred?.apiKey || cred?.clientId)
  }

  if (connector === ConnectorType.CANVA) {
    return Boolean(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET)
  }

  return credentialFromEnv(connector) !== null
}
