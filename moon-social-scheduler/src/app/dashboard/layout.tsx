import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getOptionalUserContext } from "@/lib/auth/session"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let workspaceName = "Tu Workspace"
  let userEmail: string | null = null

  try {
    const context = await getOptionalUserContext()
    if (context) {
      workspaceName = context.workspace.name
      userEmail = context.user.email
    }
  } catch {
    // Database not reachable yet; render with defaults.
  }

  return (
    <DashboardShell workspaceName={workspaceName} userEmail={userEmail}>
      {children}
    </DashboardShell>
  )
}
