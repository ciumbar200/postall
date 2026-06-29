import * as React from "react"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata = {
  title: "Entrar · Postall",
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <React.Suspense fallback={null}>
        <AuthForm mode="login" />
      </React.Suspense>
    </main>
  )
}
