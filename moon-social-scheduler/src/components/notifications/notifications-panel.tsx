"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BellIcon, CheckCheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type NotificationItem = {
  id: string
  type: string
  severity: "INFO" | "WARNING" | "ERROR"
  title: string
  body: string | null
  link: string | null
  read: boolean
  createdAt: string
}

const severityVariant: Record<NotificationItem["severity"], string> = {
  INFO: "text-blue-500",
  WARNING: "text-amber-500",
  ERROR: "text-red-500",
}

export function NotificationsPanel() {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications")
      if (!response.ok) throw new Error("Failed to load notifications")
      return response.json() as Promise<{
        unread: number
        notifications: NotificationItem[]
      }>
    },
    placeholderData: { unread: 0, notifications: [] },
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: async (payload: { id?: string; markAllRead?: boolean }) => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const notifications = data?.notifications ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellIcon className="size-4" />
          Notificaciones
          {data?.unread ? <Badge variant="secondary">{data.unread} sin leer</Badge> : null}
        </CardTitle>
        <CardDescription>
          Avisos de fallos de publicación, tokens caducados y renovaciones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutation.mutate({ markAllRead: true })}
            disabled={!notifications.some((item) => !item.read)}
          >
            <CheckCheckIcon data-icon="inline-start" />
            Marcar todo como leído
          </Button>
        </div>
        {notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay notificaciones. Todo en orden.
          </p>
        ) : (
          <ul className="divide-y">
            {notifications.map((item) => (
              <li
                key={item.id}
                className={`flex items-start justify-between gap-4 py-3 ${item.read ? "opacity-60" : ""}`}
              >
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${severityVariant[item.severity]}`}>
                    {item.title}
                  </div>
                  {item.body ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
                  ) : null}
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.link ? (
                    <Button variant="ghost" size="sm" render={<a href={item.link} />}>
                      Abrir
                    </Button>
                  ) : null}
                  {!item.read ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => mutation.mutate({ id: item.id })}
                    >
                      Marcar leído
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
