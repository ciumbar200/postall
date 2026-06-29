import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseAuthEnv } from "@/lib/supabase/env"

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // The set method is called from a Server Component where mutating
          // cookies is not allowed. Safe to ignore when middleware refreshes sessions.
        }
      },
    },
  })
}

export async function getSupabaseUser() {
  if (!hasSupabaseAuthEnv()) {
    return null
  }

  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return user
  } catch {
    return null
  }
}
