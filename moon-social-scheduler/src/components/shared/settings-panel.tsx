"use client"

import Link from "next/link"
import {
  PlugZapIcon,
  SparklesIcon,
  Share2Icon,
  Settings2Icon,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AiSettingsPanel } from "@/components/settings/ai-settings-panel"

const integrationLinks = [
  {
    title: "Redes sociales",
    description: "Conecta Instagram, TikTok, LinkedIn y más con un clic.",
    href: "/dashboard/accounts",
    icon: Share2Icon,
  },
  {
    title: "Conectores creativos",
    description: "HeyGen, Fliki, OpenAI Images y Canva desde el dashboard.",
    href: "/dashboard/connectors",
    icon: PlugZapIcon,
  },
  {
    title: "Brand Agent",
    description: "Perfil de marca y generación autónoma de campañas.",
    href: "/dashboard/agent",
    icon: SparklesIcon,
  },
]

export function SettingsPanel() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2Icon className="h-5 w-5" />
            Integraciones
          </CardTitle>
          <CardDescription>
            Todo se configura desde el dashboard. No necesitas editar archivos del servidor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 md:grid-cols-3">
            {integrationLinks.map((item) => {
              const Icon = item.icon
              return (
                <li
                  key={item.href}
                  className="flex flex-col justify-between rounded-lg border p-4"
                >
                  <div>
                    <Icon className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-fit"
                    render={<Link href={item.href} />}
                  >
                    Abrir
                  </Button>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <AiSettingsPanel />
    </div>
  )
}
