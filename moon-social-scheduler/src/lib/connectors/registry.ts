// ponytail: registro de conectores - espejo de platforms/registry.ts
import { ConnectorType } from "@/generated/prisma/enums"
import type { ContentConnector, ConnectorMap } from "./types"

const connectors: ConnectorMap = new Map()

export function registerConnector(connector: ContentConnector): void {
  connectors.set(connector.type, connector)
}

export function getConnector(type: ConnectorType): ContentConnector | undefined {
  return connectors.get(type)
}

export function listConnectors(): ContentConnector[] {
  return Array.from(connectors.values())
}

export function listByCapability(capability: "image" | "video" | "design"): ContentConnector[] {
  return listConnectors().filter(c => c.capabilities.includes(capability))
}

// ponytail: lazy load on demand
async function loadConnectors() {
  if (connectors.size > 0) return

  const { imageGenConnector } = await import("./image-gen/index")
  registerConnector(imageGenConnector)

  try {
    const { heygenConnector } = await import("./heygen/index")
    registerConnector(heygenConnector)
  } catch {
    console.warn("HeyGen connector not available")
  }

  try {
    const { flikiConnector } = await import("./fliki/index")
    registerConnector(flikiConnector)
  } catch {
    console.warn("Fliki connector not available")
  }

  try {
    const { canvaConnector } = await import("./canva/index")
    registerConnector(canvaConnector)
  } catch {
    console.warn("Canva connector not available")
  }
}

export async function ensureConnectorsLoaded(): Promise<void> {
  await loadConnectors()
}
