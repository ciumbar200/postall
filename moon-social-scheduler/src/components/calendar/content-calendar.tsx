"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { toast } from "sonner"
import { usePosts } from "@/hooks/use-dashboard-data"
import { utcDateKey } from "@/lib/ui/dates"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlatformPill } from "@/components/shared/platform-pill"
import { StatusBadge } from "@/components/shared/status-badge"

async function reschedulePost(input: { id: string; scheduledAt: string }) {
  const response = await fetch(`/api/posts/${input.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduledAt: input.scheduledAt }),
  })

  if (!response.ok) {
    throw new Error("Could not reschedule post")
  }

  return response.json()
}

export function ContentCalendar() {
  const queryClient = useQueryClient()
  const { data: posts = [] } = usePosts()
  const currentMonth = React.useMemo(() => new Date(), [])
  const todayKey = React.useMemo(() => utcDateKey(new Date()), [])
  const gridStart = startOfWeek(startOfMonth(currentMonth))
  const gridEnd = endOfWeek(endOfMonth(currentMonth))
  const days: Date[] = []
  let cursor = gridStart

  while (cursor <= gridEnd) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }

  const mutation = useMutation({
    mutationFn: reschedulePost,
    onSuccess: async () => {
      toast.success("Post rescheduled")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["posts"] }),
        queryClient.invalidateQueries({ queryKey: ["queue"] }),
      ])
    },
    onError: () => toast.error("Could not reschedule post"),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
        <CardDescription>
          Monthly publishing plan with drag and drop rescheduling.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 border-l border-t text-xs text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="border-b border-r p-2 font-medium">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dayPosts = posts.filter(
              (post) => post.scheduledAt && isSameDay(parseISO(post.scheduledAt), day)
            )

            return (
              <div
                key={day.toISOString()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const postId = event.dataTransfer.getData("text/plain")
                  if (!postId) {
                    return
                  }
                  const existing = posts.find((post) => post.id === postId)
                  const existingDate = existing?.scheduledAt
                    ? parseISO(existing.scheduledAt)
                    : new Date()
                  const scheduledAt = new Date(day)
                  scheduledAt.setHours(existingDate.getHours(), existingDate.getMinutes(), 0, 0)
                  mutation.mutate({ id: postId, scheduledAt: scheduledAt.toISOString() })
                }}
                className={[
                  "min-h-32 border-b border-r p-2",
                  isSameMonth(day, currentMonth) ? "bg-background" : "bg-muted/20",
                ].join(" ")}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-foreground">{format(day, "d")}</span>
                  {utcDateKey(day) === todayKey ? <StatusBadge status="today" /> : null}
                </div>
                <div className="flex flex-col gap-2">
                  {dayPosts.map((post) => (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={(event) =>
                        event.dataTransfer.setData("text/plain", post.id)
                      }
                      className="cursor-grab rounded-md border bg-card p-2 text-foreground shadow-sm active:cursor-grabbing"
                    >
                      <div className="line-clamp-2 text-xs leading-5">{post.baseText}</div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {post.targets?.slice(0, 2).map((target) => (
                          <PlatformPill key={`${post.id}-${target.platform}`} platform={target.platform} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
