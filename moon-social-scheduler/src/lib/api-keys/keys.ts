import { createHash, randomBytes } from "node:crypto"

export const API_KEY_SCOPES = [
  "accounts:read",
  "media:write",
  "posts:read",
  "posts:write",
  "analytics:read",
] as const

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number]

const PREFIX = "pk_live_"

export function hashApiKey(key: string) {
  return createHash("sha256").update(key).digest("hex")
}

/**
 * Generates a new API key. The full key is only returned once (shown to the user);
 * we persist the sha256 hash and a short non-secret prefix for identification.
 */
export function generateApiKey() {
  const secret = randomBytes(24).toString("base64url")
  const fullKey = `${PREFIX}${secret}`
  const prefix = fullKey.slice(0, 16)
  return {
    fullKey,
    prefix,
    hashedKey: hashApiKey(fullKey),
  }
}

export function extractBearer(request: Request): string | null {
  const header = request.headers.get("authorization")
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim()
  }
  const apiKeyHeader = request.headers.get("x-api-key")
  return apiKeyHeader ? apiKeyHeader.trim() : null
}
