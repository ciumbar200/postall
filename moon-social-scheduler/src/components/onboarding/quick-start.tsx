"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2Icon, CircleIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useAccounts, usePosts } from "@/hooks/use-dashboard-data"

const DISMISS_KEY = "postall.quickstart.dismissed"

export function QuickStart() {
  const [dismissed, setDismissed] = React.useState(true)
  const { data: accounts = [], isSuccess: accountsReady } = useAccounts()
  const { data: posts = [], isSuccess: postsReady } = usePosts()

  React.useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1")
  }, [])

  const connectedChannels = accounts.filter(
    (account) => account.status === "CONNECTED" || account.status === "EXPIRED"
  ).length
  const postsCreated = posts.length

  const hasScheduledPost = posts.some(
    (post) => post.status === "SCHEDULED" || post.status === "QUEUED" || post.status === "PUBLISHED"
  )

  const steps = [
    {
      done: connectedChannels > 0,
      title: "Conecta tu primera red",
      description: "Abre Accounts y conecta tu primera red con un clic.",
      href: "/dashboard/accounts",
      cta: "Conectar red",
    },
    {
      done: postsCreated > 0,
      title: "Crea tu primer post",
      description: "Escríbelo una vez y adáptalo por red. La IA te ayuda con el caption.",
      href: "/dashboard/compose",
      cta: "Ir al editor",
    },
    {
      done: hasScheduledPost,
      title: "Prográmalo o publícalo",
      description: "Usa el calendario y la cola para dejarlo listo.",
      href: "/dashboard/calendar",
      cta: "Ver calendario",
    },
  ]

  const completed = steps.filter((step) => step.done).length
  const progress = Math.round((completed / steps.length) * 100)

  if (
    dismissed ||
    !accountsReady ||
    !postsReady ||
    (connectedChannels > 0 && postsCreated > 0 && hasScheduledPost)
  ) {
    return null
  }

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1")
    setDismissed(true)
  }

  return (
    <Card aria-labelledby="quickstart-title">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle id="quickstart-title">Empieza en 3 pasos</CardTitle>
          <CardDescription>
            Publicar en redes debería ser fácil. Te guiamos con datos reales de tu workspace.
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={dismiss}
          aria-label="Ocultar guía de inicio"
        >
          <XIcon aria-hidden="true" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Progress value={progress} aria-label={`Progreso de configuración: ${progress}%`} />
          <p className="mt-1 text-xs text-muted-foreground">
            {completed} de {steps.length} pasos completados · {connectedChannels} red
            {connectedChannels === 1 ? "" : "es"} conectada
            {connectedChannels === 1 ? "" : "s"}
          </p>
        </div>
        <ol className="space-y-3">
          {steps.map((step) => {
            const Icon = step.done ? CheckCircle2Icon : CircleIcon
            return (
              <li
                key={step.title}
                className="flex items-center justify-between gap-4 rounded-lg border p-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <Icon
                    className={
                      step.done
                        ? "mt-0.5 size-5 text-primary"
                        : "mt-0.5 size-5 text-muted-foreground"
                    }
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {step.title}
                      {step.done ? <span className="sr-only"> (completado)</span> : null}
                    </div>
                    <div className="text-sm text-muted-foreground">{step.description}</div>
                  </div>
                </div>
                {!step.done ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    render={<Link href={step.href} />}
                  >
                    {step.cta}
                  </Button>
                ) : null}
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
