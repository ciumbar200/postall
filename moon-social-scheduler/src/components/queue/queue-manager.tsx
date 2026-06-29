"use client"

import { ClockIcon, GripVerticalIcon } from "lucide-react"
import type { Platform } from "@/lib/domain/enums"
import { useQueue } from "@/hooks/use-dashboard-data"
import { formatUtcDateTime } from "@/lib/ui/dates"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlatformPill } from "@/components/shared/platform-pill"
import { StatusBadge } from "@/components/shared/status-badge"

export function QueueManager() {
  const { data } = useQueue()
  const jobs = data?.jobs ?? []
  const slots = data?.slots ?? []

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Smart Queue</CardTitle>
          <CardDescription>
            Ordered publishing jobs backed by BullMQ and Redis.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-[auto_1fr_auto]"
            >
              <div className="flex items-center text-muted-foreground">
                <GripVerticalIcon className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{job.post.baseText}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {job.post.targets?.map((target) => (
                    <PlatformPill
                      key={`${job.id}-${target.platform}`}
                      platform={target.platform}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-xs text-muted-foreground">
                  <div className="flex items-center justify-end gap-1">
                    <ClockIcon className="size-3" />
                    {formatUtcDateTime(job.runAt)}
                  </div>
                </div>
                <StatusBadge status={job.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Slots</CardTitle>
          <CardDescription>Reusable windows per platform.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {slots.length ? (
            slots.map((slot) => (
              <div key={String(slot.id)} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <PlatformPill platform={slot.platform as Platform} />
                  <StatusBadge status={String(slot.status)} />
                </div>
                <div className="mt-2 text-muted-foreground">
                  Day {String(slot.dayOfWeek)} · {String(slot.timeOfDay)}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              No custom slots yet. New scheduled posts still enqueue with exact publish times.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
