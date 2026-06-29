import { errorJson, json } from "@/lib/api/response"
import { isAuthorizedCron } from "@/lib/cron/auth"
import { refreshExpiringTokens } from "@/lib/accounts/token-refresh"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return errorJson(new Error("Unauthorized"), 401)
  }

  try {
    const result = await refreshExpiringTokens()
    return json({ ok: true, ...result })
  } catch (error) {
    return errorJson(error)
  }
}

export async function POST(request: Request) {
  return GET(request)
}
