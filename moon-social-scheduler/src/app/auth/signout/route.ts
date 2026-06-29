import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { hasSupabaseAuthEnv } from "@/lib/supabase/env"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (hasSupabaseAuthEnv()) {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL("/login", new URL(request.url).origin))
}
