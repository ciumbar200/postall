// ponytail: tipos de conectores creativos - espejo de platforms/types.ts
import { ConnectorType, AssetKind } from "@/generated/prisma/enums"

export interface BrandContext {
  voice?: string
  tone?: string
  audience?: string
  keywords?: string[]
  bannedWords?: string[]
  paletteJson?: Record<string, string>
  sampleCaptions?: string[]
}

export interface GenerateImageInput {
  prompt: string
  aspectRatio?: string // "1:1", "16:9", "9:16", "4:5"
  n?: number
  brand?: BrandContext
}

export interface GenerateVideoInput {
  script: string
  avatarId?: string
  voiceId?: string
  aspectRatio?: string
  brand?: BrandContext
}

export interface DesignInput {
  title: string
  body?: string[]
  templateId?: string
  brand?: BrandContext
}

export interface ConnectorAsset {
  url?: string
  buffer?: ArrayBuffer
  mime: string
  filename?: string
}

export interface ConnectorResult {
  externalId?: string // for async polling
  assets: ConnectorAsset[]
  raw?: unknown
}

export interface Credential {
  apiKey?: string
  accessToken?: string
  refreshToken?: string
  webhookSecret?: string
  [key: string]: unknown
}

export interface ContentConnector {
  type: ConnectorType
  name: string
  capabilities: ("image" | "video" | "design")[]
  isConfigured(workspaceId: string): Promise<boolean>
  generateImage?(input: GenerateImageInput, cred: Credential): Promise<ConnectorResult>
  generateVideo?(input: GenerateVideoInput, cred: Credential): Promise<ConnectorResult>
  createDesign?(input: DesignInput, cred: Credential): Promise<ConnectorResult>
  pollStatus?(externalId: string, cred: Credential): Promise<ConnectorResult>
}

export type ConnectorMap = Map<ConnectorType, ContentConnector>
