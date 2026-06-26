"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3Icon,
  CalendarDaysIcon,
  FilesIcon,
  GalleryVerticalEndIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  ListChecksIcon,
  SettingsIcon,
  SparklesIcon,
  UsersRoundIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const navigation = [
  { href: "/dashboard/compose", label: "Compose", icon: LayoutDashboardIcon },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDaysIcon },
  { href: "/dashboard/queue", label: "Queue", icon: ListChecksIcon },
  { href: "/dashboard/accounts", label: "Accounts", icon: UsersRoundIcon },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3Icon },
  { href: "/dashboard/media", label: "Media", icon: LibraryIcon },
  { href: "/dashboard/templates", label: "Templates", icon: FilesIcon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="hidden border-r bg-sidebar/80 lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-3 px-5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GalleryVerticalEndIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight">MoOn</div>
              <div className="text-xs text-muted-foreground">Social Scheduler</div>
            </div>
          </div>
          <Separator />
          <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    active && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
          <div className="border-t p-4">
            <div className="rounded-lg bg-muted/60 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <SparklesIcon className="size-4 text-primary" />
                Direct APIs
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Instagram and TikTok adapters are wired for the first milestone.
              </p>
            </div>
          </div>
        </aside>
        <main className="min-w-0 overflow-x-hidden">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/92 px-4 backdrop-blur md:px-6">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GalleryVerticalEndIcon className="size-4" />
              </div>
              <span className="text-sm font-semibold">MoOn</span>
            </div>
            <div className="hidden min-w-0 lg:block">
              <div className="text-sm font-medium">MoOn Workspace</div>
              <div className="text-xs text-muted-foreground">
                Self-hosted scheduler · PostgreSQL · Redis worker
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <Button variant="outline" size="sm">
                <CalendarDaysIcon data-icon="inline-start" />
                Today
              </Button>
              <Button size="sm" className="hidden sm:inline-flex">
                <SparklesIcon data-icon="inline-start" />
                New post
              </Button>
            </div>
          </header>
          <div className="px-4 py-4 md:px-6 md:py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
