"use client"

import { BarChart3Icon, MousePointerClickIcon, TrendingUpIcon, UsersIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PlatformPill } from "@/components/shared/platform-pill"
import { Platform } from "@/lib/domain/enums"

const stats = [
  { label: "Reach", value: "42.8k", icon: UsersIcon, progress: 72 },
  { label: "Impressions", value: "118k", icon: BarChart3Icon, progress: 83 },
  { label: "Engagement", value: "7.4%", icon: TrendingUpIcon, progress: 64 },
  { label: "Clicks", value: "2.1k", icon: MousePointerClickIcon, progress: 48 },
]

export function AnalyticsOverview() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.label}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="size-4 text-primary" />
                  {stat.label}
                </CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{stat.value}</div>
                <Progress className="mt-3" value={stat.progress} />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Trend</CardTitle>
          <CardDescription>
            Official API metrics are stored per post target and aggregated by period.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {[Platform.INSTAGRAM, Platform.TIKTOK].map((platform, index) => (
            <div key={platform} className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <PlatformPill platform={platform} />
                <span className="text-sm text-muted-foreground">
                  {index === 0 ? "+18.2%" : "+9.7%"}
                </span>
              </div>
              <div className="mt-5 flex h-32 items-end gap-2">
                {[42, 64, 51, 74, 69, 88, 79].map((height, barIndex) => (
                  <div
                    key={barIndex}
                    className="flex-1 rounded-t bg-primary/70"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
