import { ConnectorType, AssetKind } from "@/generated/prisma/enums"
import { ensureConnectorsLoaded, getConnector } from "./registry"
import { getCredentialRecord } from "./credentials"
import { saveGeneratedAsset } from "./persist-asset"
import type {
  BrandContext,
  GenerateImageInput,
  GenerateVideoInput,
  DesignInput,
} from "./types"

export type InvokeResult = {
  generatedAssetId: string
  mediaAssetId?: string
  externalId?: string
  status: string
  publicUrl?: string
}

export async function invokeConnector(params: {
  workspaceId: string
  uploaderId: string
  connector: ConnectorType
  kind: AssetKind
  prompt: string
  image?: Omit<GenerateImageInput, "brand">
  video?: Omit<GenerateVideoInput, "brand">
  design?: DesignInput
  brand?: BrandContext
  meta?: Record<string, unknown>
}): Promise<InvokeResult | null> {
  await ensureConnectorsLoaded()
  const instance = getConnector(params.connector)
  if (!instance) return null

  const record = await getCredentialRecord(params.workspaceId, params.connector)
  if (!record) return null

  let result

  if (params.kind === AssetKind.IMAGE && instance.generateImage && params.image) {
    result = await instance.generateImage(
      { ...params.image, brand: params.brand },
      record.cred
    )
  } else if (params.kind === AssetKind.VIDEO && instance.generateVideo && params.video) {
    result = await instance.generateVideo(
      { ...params.video, brand: params.brand },
      record.cred
    )
  } else if (params.kind === AssetKind.DESIGN && instance.createDesign && params.design) {
    result = await instance.createDesign(
      { ...params.design, brand: params.brand },
      record.cred
    )
  } else {
    return null
  }

  return saveGeneratedAsset({
    workspaceId: params.workspaceId,
    uploaderId: params.uploaderId,
    connector: params.connector,
    kind: params.kind,
    prompt: params.prompt,
    result,
    meta: params.meta,
  })
}

export async function isConnectorReady(
  workspaceId: string,
  connector: ConnectorType
): Promise<boolean> {
  await ensureConnectorsLoaded()
  const instance = getConnector(connector)
  if (!instance) return false
  const record = await getCredentialRecord(workspaceId, connector)
  return !!record
}
