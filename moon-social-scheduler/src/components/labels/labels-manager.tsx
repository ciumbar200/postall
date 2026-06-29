"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { TagIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"

type Label = {
  id: string
  name: string
  color: string
  postCount: number
}

const PRESET_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
]

export function LabelsManager() {
  const queryClient = useQueryClient()
  const [name, setName] = React.useState("")
  const [color, setColor] = React.useState(PRESET_COLORS[0])

  const { data } = useQuery({
    queryKey: ["labels"],
    queryFn: async () => {
      const response = await fetch("/api/labels")
      if (!response.ok) throw new Error("No se pudieron cargar las etiquetas")
      return response.json() as Promise<{ labels: Label[] }>
    },
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Error creando la etiqueta")
      return payload
    },
    onSuccess: () => {
      setName("")
      queryClient.invalidateQueries({ queryKey: ["labels"] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Error"),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch("/api/labels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["labels"] }),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TagIcon className="size-4" />
          Etiquetas
        </CardTitle>
        <CardDescription>
          Organiza y filtra tus posts por campaña, cliente o tema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field className="flex-1 min-w-[180px]">
            <FieldLabel htmlFor="label-name">Nombre</FieldLabel>
            <Input
              id="label-name"
              placeholder="Campaña verano"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <div className="flex items-center gap-1">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-label={`Color ${preset}`}
                onClick={() => setColor(preset)}
                className="size-6 rounded-full border-2"
                style={{
                  backgroundColor: preset,
                  borderColor: color === preset ? "var(--foreground)" : "transparent",
                }}
              />
            ))}
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name || createMutation.isPending}
          >
            Crear
          </Button>
        </div>

        {data?.labels.length ? (
          <ul className="flex flex-wrap gap-2">
            {data.labels.map((label) => (
              <li
                key={label.id}
                className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span>{label.name}</span>
                <span className="text-xs text-muted-foreground">{label.postCount}</span>
                <button
                  type="button"
                  aria-label="Eliminar"
                  onClick={() => deleteMutation.mutate(label.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Aún no hay etiquetas.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
