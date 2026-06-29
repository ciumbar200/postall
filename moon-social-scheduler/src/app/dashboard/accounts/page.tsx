import { Suspense } from "react"
import { AccountsOverview } from "@/components/accounts/accounts-overview"

export default function AccountsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando cuentas…</p>}>
      <AccountsOverview />
    </Suspense>
  )
}
