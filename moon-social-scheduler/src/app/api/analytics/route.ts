import { errorJson, json } from "@/lib/api/response"
import { getAnalyticsSnapshot } from "@/lib/local-dev/store"

export async function GET() {
  try {
    return json(getAnalyticsSnapshot())
  } catch (error) {
    return errorJson(error)
  }
}
