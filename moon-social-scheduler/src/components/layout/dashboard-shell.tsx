"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3Icon,
  BellIcon,
  BuildingIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  FilesIcon,
  GalleryVerticalEndIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  ListChecksIcon,
  LogOutIcon,
  MenuIcon,
  PlugIcon,
  PlugZapIcon,
  SettingsIcon,
  SparklesIcon,
  UsersRoundIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const navigation = [
  { href: "/dashboard/compose", label: "Compose", icon: LayoutDashboardIcon },
  { href: "/dashboard/agent", label: "Brand Agent", icon: SparklesIcon },
  { href: "/dashboard/connectors", label: "Connectors", icon: PlugZapIcon },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDaysIcon },
  { href: "/dashboard/queue", label: "Queue", icon: ListChecksIcon },
  { href: "/dashboard/accounts", label: "Accounts", icon: UsersRoundIcon },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3Icon },
  { href: "/dashboard/media", label: "Media", icon: LibraryIcon },
  { href: "/dashboard/templates", label: "Templates", icon: FilesIcon },
  { href: "/dashboard/notifications", label: "Notifications", icon: BellIcon },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCardIcon },
  { href: "/dashboard/api", label: "API & Agents", icon: PlugIcon },
  { href: "/dashboard/agency", label: "Agency", icon: BuildingIcon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
]

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <>
      {navigation.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "group flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-all duration-300 relative overflow-hidden",
              active
                ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary-foreground border border-primary/30 shadow-lg shadow-primary/10"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground hover:border hover:border-white/10"
            )}
          >
            {active && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 animate-pulse" />
            )}
            <Icon className="size-5 shrink-0 relative z-10" aria-hidden="true" />
            <span className="relative z-10">{item.label}</span>
            {active && (
              <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary shadow-lg shadow-primary/50 animate-pulse" />
            )}
          </Link>
        )
      })}
    </>
  )
}

function BrandMark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 group">
      <div className="flex size-10 items-center justify-center rounded-xl animated-gradient shadow-lg shadow-primary/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/30 group-hover:scale-105">
        <GalleryVerticalEndIcon className="size-5 text-white" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="text-base font-bold leading-tight gradient-text">Postall</div>
        <div className="text-xs text-muted-foreground">El publisher más accesible</div>
      </div>
    </Link>
  )
}

function SignOutForm() {
  return (
    <form action="/auth/signout" method="post">
      <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
        <LogOutIcon data-icon="inline-start" aria-hidden="true" />
        Cerrar sesión
      </Button>
    </form>
  )
}

export function DashboardShell({
  children,
  workspaceName = "Tu Workspace",
  userEmail = null,
}: {
  children: React.ReactNode
  workspaceName?: string
  userEmail?: string | null
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Liquid glass background blobs */}
      <div className="liquid-blob w-96 h-96 bg-primary/20 -top-48 -left-48" style={{ animationDelay: '0s' }} />
      <div className="liquid-blob w-80 h-80 bg-accent/20 top-1/3 -right-40" style={{ animationDelay: '5s' }} />
      <div className="liquid-blob w-72 h-72 bg-secondary/20 bottom-20 left-1/4" style={{ animationDelay: '10s' }} />

      <a
        href="#main-content"
        className="sr-only z-50 rounded-xl bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 glass"
      >
        Saltar al contenido
      </a>

      <div className="grid min-h-screen lg:grid-cols-[280px_1fr] relative z-10">
        {/* Sidebar with liquid glass effect */}
        <aside
          className="hidden border-r border-white/5 lg:flex lg:flex-col glass-strong"
          aria-label="Navegación principal"
        >
          <div className="flex h-16 items-center px-6 border-b border-white/5">
            <BrandMark />
          </div>
          <Separator className="bg-white/5" />
          <nav className="flex flex-1 flex-col gap-2 px-4 py-4" aria-label="Secciones">
            <NavLinks pathname={pathname} />
          </nav>
          <div className="border-t border-white/5 p-4 glass">
            {userEmail ? (
              <div className="mb-3 min-w-0">
                <div className="truncate text-xs font-semibold text-foreground">{userEmail}</div>
                <div className="truncate text-xs text-muted-foreground">{workspaceName}</div>
              </div>
            ) : null}
            <SignOutForm />
          </div>
        </aside>

        <main id="main-content" tabIndex={-1} className="min-w-0 overflow-x-hidden focus:outline-none">
          {/* Glass header */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-white/5 glass px-4 md:px-6">
            <div className="flex items-center gap-3 lg:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" aria-label="Abrir menú de navegación" />
                  }
                >
                  <MenuIcon aria-hidden="true" />
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 glass-strong">
                  <SheetHeader className="border-b border-white/5">
                    <SheetTitle className="text-left px-6 py-4">
                      <BrandMark />
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4" aria-label="Secciones">
                    <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                  </nav>
                  <div className="border-t border-white/5 p-4 glass">
                    {userEmail ? (
                      <div className="mb-3 min-w-0">
                        <div className="truncate text-xs font-semibold">{userEmail}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {workspaceName}
                        </div>
                      </div>
                    ) : null}
                    <SignOutForm />
                  </div>
                </SheetContent>
              </Sheet>
              <span className="text-sm font-semibold gradient-text">Postall</span>
            </div>

            <div className="hidden min-w-0 lg:block">
              <div className="text-sm font-semibold">{workspaceName}</div>
              <div className="text-xs text-muted-foreground">
                Fácil, asequible y para todos · Calendario · API + MCP
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-3">
              <Button size="sm" variant="glow" render={<Link href="/dashboard/compose" />}>
                <SparklesIcon data-icon="inline-start" aria-hidden="true" />
                <span className="hidden sm:inline">Nuevo post</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            </div>
          </header>

          <div className="px-4 py-6 md:px-6 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
