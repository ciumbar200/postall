"use client"

import { DatabaseIcon, HardDriveIcon, KeyRoundIcon, ServerIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Field, FieldContent, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field"

const settings = [
  {
    title: "PostgreSQL",
    description: "Primary persistence through Prisma ORM.",
    icon: DatabaseIcon,
  },
  {
    title: "Redis Worker",
    description: "BullMQ async publishing with retries.",
    icon: ServerIcon,
  },
  {
    title: "Local Storage",
    description: "Media stored in public/uploads for self-hosted deployments.",
    icon: HardDriveIcon,
  },
  {
    title: "OAuth Secrets",
    description: "Platform credentials loaded from server-only env vars.",
    icon: KeyRoundIcon,
  },
]

export function SettingsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Deployment and platform configuration for the current workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {settings.map((item) => {
            const Icon = item.icon

            return (
              <Field key={item.title} orientation="horizontal" className="rounded-lg border p-3">
                <Icon className="size-4 text-primary" />
                <FieldContent>
                  <FieldTitle>{item.title}</FieldTitle>
                  <FieldLabel className="sr-only">{item.title}</FieldLabel>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </FieldContent>
                <Switch checked readOnly />
              </Field>
            )
          })}
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
