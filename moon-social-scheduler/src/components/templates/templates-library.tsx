"use client"

import { HashIcon, VariableIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const templates = [
  {
    name: "Launch announcement",
    body: "New release: {{title}} is live today. {{emoji}}",
    tags: ["launch", "instagram", "tiktok"],
  },
  {
    name: "Behind the scenes",
    body: "A quick look at how {{team}} built this workflow.",
    tags: ["video", "story"],
  },
]

const hashtagGroups = [
  ["#socialmedia", "#contentcalendar", "#creatorworkflow"],
  ["#buildinpublic", "#automation", "#opensource"],
]

export function TemplatesLibrary() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>Reusable post bodies with dynamic variables.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {templates.map((template) => (
            <div key={template.name} className="rounded-lg border bg-muted/20 p-4">
              <div className="font-medium">{template.name}</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{template.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variables</CardTitle>
          <CardDescription>Dynamic replacements at compose time.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <VariableIcon className="size-4 text-primary" />
              Built-ins
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["{{date}}", "{{weekday}}", "{{emoji}}", "{{workspace}}"].map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <HashIcon className="size-4 text-primary" />
              Hashtag groups
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {hashtagGroups.map((group, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  {group.join(" ")}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
