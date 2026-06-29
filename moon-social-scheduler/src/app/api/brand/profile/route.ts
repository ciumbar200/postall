import { z } from "zod"
import { json, errorJson } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { getBrandProfile, updateBrandProfile } from "@/lib/agent/brand-agent"
import { isMissingTableError } from "@/lib/db/errors"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const updateSchema = z.object({
  voice: z.string().optional(),
  tone: z.string().optional(),
  audience: z.string().optional(),
  pillars: z.any().optional(),
  keywords: z.array(z.string()).optional(),
  bannedWords: z.array(z.string()).optional(),
  paletteJson: z.any().optional(),
  fonts: z.array(z.string()).optional(),
  sampleCaptions: z.array(z.string()).optional(),
  logoMediaId: z.string().optional(),
})

export async function GET() {
  try {
    const { workspaceId } = await requireUserContext()
    const profile = await getBrandProfile(workspaceId)
    return json(profile || null)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    if (isMissingTableError(error, "BrandProfile")) {
      return json(null)
    }
    return errorJson(error)
  }
}

export async function PUT(request: Request) {
  try {
    const { workspaceId } = await requireUserContext()
    const input = updateSchema.parse(await request.json())
    const profile = await updateBrandProfile(workspaceId, input)
    return json(profile)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    if (isMissingTableError(error, "BrandProfile")) {
      return errorJson(
        new Error("Aplica la migración 006_brand_agent_connectors en Supabase"),
        503
      )
    }
    return errorJson(error)
  }
}
