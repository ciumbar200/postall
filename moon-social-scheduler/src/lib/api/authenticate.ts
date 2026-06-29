import { prisma } from "@/lib/db/client"
import { extractBearer, hashApiKey, type ApiKeyScope } from "@/lib/api-keys/keys"
import { incrementUsage } from "@/lib/billing/subscription"

export class ApiAuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.name = "ApiAuthError"
    this.status = status
  }
}

export type ApiKeyContext = {
  apiKeyId: string
  workspaceId: string
  scopes: string[]
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(apiKeyId: string, limitPerMin: number) {
  const now = Date.now()
  const bucket = rateBuckets.get(apiKeyId)
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(apiKeyId, { count: 1, resetAt: now + 60_000 })
    return
  }
  bucket.count += 1
  if (bucket.count > limitPerMin) {
    throw new ApiAuthError("Rate limit exceeded. Try again shortly.", 429)
  }
}

export async function authenticateApiKey(request: Request): Promise<ApiKeyContext> {
  const presented = extractBearer(request)
  if (!presented) {
    throw new ApiAuthError("Missing API key. Use Authorization: Bearer <key> or X-Api-Key.")
  }

  const hashedKey = hashApiKey(presented)
  const apiKey = await prisma.apiKey.findUnique({ where: { hashedKey } })

  if (!apiKey || apiKey.revokedAt) {
    throw new ApiAuthError("Invalid or revoked API key.")
  }

  checkRateLimit(apiKey.id, apiKey.rateLimitPerMin)

  // Best-effort, non-blocking side effects.
  void prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => undefined)
  void incrementUsage(apiKey.workspaceId, "apiCalls").catch(() => undefined)

  return {
    apiKeyId: apiKey.id,
    workspaceId: apiKey.workspaceId,
    scopes: apiKey.scopes,
  }
}

export function requireScope(context: ApiKeyContext, scope: ApiKeyScope) {
  // An empty scope list means full access (owner key).
  if (context.scopes.length === 0) return
  if (!context.scopes.includes(scope)) {
    throw new ApiAuthError(`API key missing required scope: ${scope}`, 403)
  }
}
