import { errorJson } from "@/lib/api/response"

export async function GET(
  request: Request,
  context: RouteContext<"/api/accounts/[platform]/callback">
) {
  try {
    const { platform } = await context.params
    return Response.redirect(new URL(`/dashboard/accounts?connected=${platform}`, request.url), 302)
  } catch (error) {
    return errorJson(error)
  }
}
