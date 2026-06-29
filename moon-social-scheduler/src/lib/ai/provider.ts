import { createOpenAI } from "@ai-sdk/openai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { generateText, generateObject } from "ai"
import { z } from "zod"
import { optionalEnv } from "@/lib/env"
import { resolveAiSettings } from "@/lib/integrations/resolve"

export type AiProvider = "openai" | "anthropic" | "openrouter"

const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-20241022",
  openrouter: "deepseek/deepseek-chat-v3-0324",
}

function buildClient(settings: NonNullable<Awaited<ReturnType<typeof resolveAiSettings>>>) {
  switch (settings.provider) {
    case "anthropic":
      return createAnthropic({ apiKey: settings.apiKey })
    case "openrouter": {
      const appUrl =
        settings.extras?.httpReferer ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        "https://postall.app"

      return createOpenAI({
        apiKey: settings.apiKey,
        baseURL: "https://openrouter.ai/api/v1",
        headers: {
          "HTTP-Referer": appUrl,
          "X-Title": settings.extras?.appTitle || optionalEnv("OPENROUTER_APP_TITLE", "Postall"),
        },
      })
    }
    case "openai":
    default:
      return createOpenAI({ apiKey: settings.apiKey })
  }
}

async function getResolvedSettings(workspaceId?: string) {
  const settings = await resolveAiSettings(workspaceId)
  if (!settings?.apiKey) {
    throw new Error(
      "La IA no está configurada. Contacta con soporte o configura tu proveedor en Ajustes."
    )
  }
  return settings
}

export async function generateTextAI({
  system,
  prompt,
  temperature = 0.7,
  workspaceId,
}: {
  system: string
  prompt: string
  temperature?: number
  workspaceId?: string
}): Promise<string> {
  const settings = await getResolvedSettings(workspaceId)
  const client = buildClient(settings)
  const result = await generateText({
    model: client(settings.model),
    system,
    prompt,
    temperature,
  })
  return result.text
}

export async function generateStructured<T extends z.ZodType>({
  schema,
  prompt,
  system,
  workspaceId,
}: {
  schema: T
  prompt: string
  system?: string
  workspaceId?: string
}): Promise<z.infer<T>> {
  const settings = await getResolvedSettings(workspaceId)
  const client = buildClient(settings)
  const result = await generateObject({
    model: client(settings.model),
    schema,
    prompt,
    system: system || "Eres un asistente experto.",
  })
  return result.object as z.infer<T>
}

export async function isConfigured(workspaceId?: string): Promise<boolean> {
  const settings = await resolveAiSettings(workspaceId)
  return Boolean(settings?.apiKey)
}

export async function getAiConfig(workspaceId?: string) {
  const settings = await resolveAiSettings(workspaceId)
  if (!settings) {
    return {
      provider: (process.env.AI_PROVIDER || "openrouter") as AiProvider,
      model: process.env.AI_MODEL || DEFAULT_MODELS.openrouter,
      configured: false,
      source: "missing" as const,
    }
  }
  return {
    provider: settings.provider,
    model: settings.model,
    configured: true,
    source: settings.source,
  }
}

export { z }
