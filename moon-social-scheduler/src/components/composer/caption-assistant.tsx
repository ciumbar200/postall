"use client"

import * as React from "react"
import { SparklesIcon } from "lucide-react"
import { toast } from "sonner"
import { useComposerStore } from "@/stores/composer-store"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function CaptionAssistant() {
  const setBaseText = useComposerStore((state) => state.setBaseText)
  const [prompt, setPrompt] = React.useState("")
  const [tone, setTone] = React.useState("cercano")
  const [pending, setPending] = React.useState(false)
  const [captions, setCaptions] = React.useState<string[]>([])

  async function generate() {
    if (!prompt.trim()) return
    setPending(true)
    try {
      const response = await fetch("/api/ai/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tone, count: 3 }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "No se pudo generar")
      setCaptions(payload.captions ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" />
          Asistente IA de captions
        </CardTitle>
        <CardDescription>
          Describe tu publicación y genera variantes con hashtags. Pulsa una para usarla.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Ej: lanzamiento de zapatillas edición limitada"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <Input
            className="sm:max-w-[140px]"
            placeholder="Tono"
            value={tone}
            onChange={(event) => setTone(event.target.value)}
          />
          <Button onClick={generate} disabled={pending || !prompt.trim()}>
            Generar
          </Button>
        </div>
        {captions.length ? (
          <ul className="space-y-2">
            {captions.map((caption, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => {
                    setBaseText(caption)
                    toast.success("Caption aplicada al editor")
                  }}
                  className="w-full rounded-lg border bg-muted/30 p-3 text-left text-sm transition-colors hover:bg-muted"
                >
                  {caption}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}
