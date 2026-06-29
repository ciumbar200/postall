import { NextResponse, type NextRequest } from "next/server"

const PROTECTED_PREFIX = "/dashboard"
const AUTH_ROUTES = ["/login", "/signup"]

function getSupabaseAuthEnv() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    ""

  if (!url || !anonKey) {
    return null
  }

  return { url, anonKey }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const needsAuth =
    pathname.startsWith(PROTECTED_PREFIX) || AUTH_ROUTES.includes(pathname)

  if (!needsAuth) {
    return NextResponse.next()
  }

  const supabase = getSupabaseAuthEnv()
  if (!supabase) {
    return NextResponse.next()
  }

  const { runAuthMiddleware } = await import("@/lib/auth/middleware-handler")
  return runAuthMiddleware(request, supabase)
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
}
