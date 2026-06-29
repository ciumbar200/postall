import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { withTimeout } from "@/lib/async/with-timeout"

const PROTECTED_PREFIX = "/dashboard"
const AUTH_ROUTES = ["/login", "/signup"]
const MIDDLEWARE_TIMEOUT_MS = 5000

export async function runAuthMiddleware(
  request: NextRequest,
  supabase: { url: string; anonKey: string }
) {
  let response = NextResponse.next({ request })

  const client = createServerClient(supabase.url, supabase.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  let user: Awaited<ReturnType<typeof client.auth.getUser>>["data"]["user"] = null

  try {
    const result = await withTimeout(
      client.auth.getUser(),
      MIDDLEWARE_TIMEOUT_MS,
      "supabase.auth.getUser"
    )
    user = result.data.user
  } catch {
    user = null
  }

  const { pathname } = request.nextUrl

  if (!user && pathname.startsWith(PROTECTED_PREFIX)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(url)
  }

  if (user && AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard/compose"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return response
}
