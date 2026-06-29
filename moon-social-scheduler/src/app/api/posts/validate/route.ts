import { z } from "zod"
import { Platform } from "@/lib/domain/enums"
import { errorJson, json } from "@/lib/api/response"
import { validatePost } from "@/lib/platforms/validation"

const schema = z.object({
  text: z.string().default(""),
  platforms: z.array(z.enum(Object.values(Platform) as [Platform, ...Platform[]])).default([]),
  media: z
    .array(
      z.object({
        type: z.enum(["IMAGE", "GIF", "VIDEO"]),
        mimeType: z.string(),
        byteSize: z.union([z.number(), z.string()]).default(0),
      })
    )
    .default([]),
  settings: z.record(z.string(), z.unknown()).optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json())

    const media = input.media.map((m) => ({
      type: m.type,
      mimeType: m.mimeType,
      byteSize: Number(m.byteSize),
    }))

    const results = input.platforms.map((platform) =>
      validatePost(platform, {
        text: input.text,
        media,
        settings: input.settings ?? null,
      })
    )

    return json({
      ok: results.every((result) => result.ok),
      results,
    })
  } catch (error) {
    return errorJson(error, 400)
  }
}
