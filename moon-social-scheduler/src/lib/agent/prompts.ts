// ponytail: prompts del Agente de Marca
import type { BrandContext } from "@/lib/connectors/types"

const BASE_SYSTEM = `Eres un estratega de contenido y copywriter experto en redes sociales. Tu objetivo es crear campañas de contenido multiplataforma que resuenen con la audiencia objetivo y mantengan una voz de marca consistente.

Considera siempre:
- La plataforma objetivo (Instagram, TikTok, LinkedIn, etc.) y sus formatos nativos
- La voz y tono de la marca
- Las palabras clave que deben incluirse
- Las palabras prohibidas que deben evitarse
- Los pilares de contenido de la marca
- La paleta de colores y estética visual
- Ejemplos de captions previas que funcionaron bien`

export function buildBrandAgentSystem(brand?: BrandContext): string {
  let system = BASE_SYSTEM

  if (brand) {
    if (brand.voice) system += `\n\nVoz de marca: ${brand.voice}`
    if (brand.tone) system += `\nTono: ${brand.tone}`
    if (brand.audience) system += `\nAudiencia objetivo: ${brand.audience}`
    if (brand.keywords?.length) system += `\nPalabras clave: ${brand.keywords.join(", ")}`
    if (brand.bannedWords?.length) system += `\nPalabras prohibidas: ${brand.bannedWords.join(", ")}`
    if (brand.sampleCaptions?.length) {
      system += `\n\nEjemplos de captions de la marca:\n${brand.sampleCaptions.map((c, i) => `${i + 1}. ${c}`).join("\n")}`
    }
  }

  return system
}

export const PLAN_PROMPT = (params: {
  brief: string
  platforms: string[]
  horizonWeeks: number
  postsPerWeek: number
  scheduleStart: string
}) => `Analiza este brief de campaña y crea un plan de contenido para ${params.horizonWeeks} semanas.

Brief: "${params.brief}"
Plataformas objetivo: ${params.platforms.join(", ")}
Inicio del calendario: ${params.scheduleStart}
Ritmo objetivo: ~${params.postsPerWeek} publicaciones por semana
Total aproximado de piezas: ${params.horizonWeeks * params.postsPerWeek}

Para cada pieza de contenido especifica:
1. platform y format (carousel, reel, static, story)
2. needsImage y needsVideo (reels/tiktok suelen necesitar video)
3. captionBrief (idea principal + CTA)
4. scheduledAt (ISO 8601 UTC, distribuido en las ${params.horizonWeeks} semanas)
5. weekNumber (1-${params.horizonWeeks})
6. pillar (pilar de contenido si aplica)

Incluye horizonWeeks: ${params.horizonWeeks} y rationale estratégico.`

export const CAPTION_PROMPT = (platform: string, brief: string, brand?: BrandContext) => `Escribe un caption optimizado para ${platform}.

Brief del contenido: "${brief}"

${brand ? buildBrandAgentSystem(brand) : ""}

Requisitos:
- Longitud adecuada para la plataforma
- Emojis relevantes
- Hashtags estratégicos
- Call-to-action claro

Devuelve solo el texto del caption.`

export const IMAGE_PROMPT = (caption: string, brand?: BrandContext) => `Genera un prompt detallado para crear una imagen que acompañe este caption:

Caption: "${caption}"

${brand?.paletteJson ? `Paleta de colores: ${JSON.stringify(brand.paletteJson)}` : ""}
${brand?.tone ? `Tono visual: ${brand.tone}` : ""}

El prompt debe ser descriptivo y detallado, adecuado para DALL-E o similar.`

export const VIDEO_SCRIPT_PROMPT = (brief: string, duration: number = 30) => `Convierte este brief en un guion para video de ${duration} segundos.

Brief: "${brief}"

Estructura:
- Hook (primeros 3 segundos)
- Cuerpo del mensaje
- Call-to-action final

Incluye direcciones visuales entre [corchetes].`
