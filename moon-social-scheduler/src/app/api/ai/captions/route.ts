import { z } from "zod"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { generateTextAI, isConfigured, getAiConfig } from "@/lib/ai/provider"

export const runtime = "nodejs"

const schema = z.object({
  prompt: z.string().min(1),
  platform: z.string().optional(),
  tone: z.string().optional(),
  count: z.number().int().min(1).max(5).default(3),
})

function heuristicCaptions(prompt: string, count: number): string[] {
  const trimmed = prompt.trim().replace(/\s+/g, " ")
  const base = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
  const hashtags = trimmed
    .split(" ")
    .filter((word) => word.length > 4)
    .slice(0, 3)
    .map((word) => `#${word.toLowerCase().replace(/[^a-z0-9]/g, "")}`)
    .join(" ")

  const variants = [
    `${base} ✨`,
    `${base}\n\n${hashtags}`,
    `🔥 ${base} — ¿qué opinas?`,
    `${base} 👇\n${hashtags}`,
    `Nuevo: ${base}`,
  ]
  return variants.slice(0, count)
}

async function aiCaptions(
  prompt: string,
  platform: string | undefined,
  tone: string | undefined,
  count: number,
  workspaceId: string
): Promise<string[]> {
  if (!(await isConfigured(workspaceId))) {
    return heuristicCaptions(prompt, count)
  }

  const system = `Eres un copywriter experto en redes sociales. Genera ${count} variantes de caption${
    platform ? ` para ${platform}` : ""
  }${tone ? ` con tono ${tone}` : ""}. Incluye emojis y hashtags relevantes. Devuelve solo las captions separadas por una línea con "---".`

  try {
    const content = await generateTextAI({
      system,
      prompt,
      temperature: 0.8,
      workspaceId,
    })
    const captions = content
      .split("---")
      .map((part) => part.trim())
      .filter(Boolean)

    return captions.length ? captions.slice(0, count) : heuristicCaptions(prompt, count)
  } catch (error) {
    console.error('AI captions error:', error)
    return heuristicCaptions(prompt, count)
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await requireUserContext()
    const input = schema.parse(await request.json())
    const captions = await aiCaptions(
      input.prompt,
      input.platform,
      input.tone,
      input.count,
      workspaceId
    )
    const ai = await getAiConfig(workspaceId)
    const configured = await isConfigured(workspaceId)
    return json({
      captions,
      provider: configured ? ai.provider : "heuristic",
      model: configured ? ai.model : null,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    return errorJson(error)
  }
}
