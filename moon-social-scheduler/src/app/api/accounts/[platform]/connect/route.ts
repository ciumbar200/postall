import { Platform } from "@/generated/prisma/enums"
import { errorJson } from "@/lib/api/response"
import { connectPlatform } from "@/lib/local-dev/store"

const platformMap = {
  instagram: Platform.INSTAGRAM,
  tiktok: Platform.TIKTOK,
} as const

export async function GET(
  request: Request,
  context: RouteContext<"/api/accounts/[platform]/connect">
) {
  try {
    const { platform } = await context.params
    const mapped = platformMap[platform as keyof typeof platformMap]

    if (!mapped) {
      return errorJson(new Error("Unsupported platform in local mode."), 400)
    }

    connectPlatform(mapped)

    return Response.redirect(new URL(`/dashboard/accounts?connected=${platform}`, request.url), 302)
  } catch (error) {
    return errorJson(error)
  }
}
