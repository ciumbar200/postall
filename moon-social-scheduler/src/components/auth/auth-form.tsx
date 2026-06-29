"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { hasSupabaseAuthEnv } from "@/lib/supabase/env"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type AuthMode = "login" | "signup"

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/dashboard/compose"
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [pending, setPending] = React.useState(false)

  const supabaseAuthEnabled = hasSupabaseAuthEnv()
  const supabase = React.useMemo(
    () => (supabaseAuthEnabled ? createSupabaseBrowserClient() : null),
    [supabaseAuthEnabled]
  )

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!supabase) {
      router.push(redirectTo)
      return
    }
    setPending(true)

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
          },
        })
        if (error) throw error
        toast.success("Cuenta creada. Revisa tu email para confirmar si es necesario.")
        router.push(redirectTo)
        router.refresh()
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push(redirectTo)
        router.refresh()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed")
    } finally {
      setPending(false)
    }
  }

  async function handleGoogle() {
    if (!supabase) {
      toast.error("Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY")
      return
    }
    setPending(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        },
      })
      if (error) throw error
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed")
      setPending(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{mode === "signup" ? "Crea tu cuenta Postall" : "Entra en Postall"}</CardTitle>
        <CardDescription>
          {mode === "signup"
            ? "El publisher de redes más accesible: fácil, asequible y para todos. 3 canales gratis, sin tarjeta."
            : "Bienvenido de vuelta. Continúa donde lo dejaste."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!supabaseAuthEnabled && (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <p className="font-medium">Modo desarrollo</p>
            <p className="mt-1 text-muted-foreground">
              Supabase Auth no está configurado. Usa el dashboard con usuario dev o añade{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> al .env.
            </p>
            <Button asChild className="mt-3 w-full" variant="secondary">
              <Link href="/dashboard/compose">Ir al dashboard</Link>
            </Button>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            <Button type="submit" disabled={pending}>
              {mode === "signup" ? "Crear cuenta" : "Entrar"}
            </Button>
            <Button type="button" variant="outline" onClick={handleGoogle} disabled={pending}>
              Continuar con Google
            </Button>
          </FieldGroup>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "signup" ? (
            <>
              ¿Ya tienes cuenta?{" "}
              <Link className="text-primary underline-offset-4 hover:underline" href="/login">
                Entra
              </Link>
            </>
          ) : (
            <>
              ¿Nuevo en Postall?{" "}
              <Link className="text-primary underline-offset-4 hover:underline" href="/signup">
                Crea una cuenta
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  )
}
