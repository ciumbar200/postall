import { z } from "zod"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { PlanLimitError } from "@/lib/billing/subscription"
import { assertCustomIntegrationsAccess } from "@/lib/integrations/access"
import {
  deletePlatformAppCredentials,
  getMaskedPlatformAppCredentials,
  setPlatformAppCredentials,
} from "@/lib/integrations/resolve"
import { platformFromSlug, supportedPlatformSlugs } from "@/lib/platforms/registry"
import type { PlatformSlug } from "@/lib/platforms/types"
import { hasFeature } from "@/lib/billing/subscription"

export const runtime = "nodejs"

const putSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
})

function isPlatformSlug(slug: string): slug is PlatformSlug {
  return supportedPlatformSlugs.includes(slug as PlatformSlug)
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { workspaceId } = await requireUserContext()
    const { slug } = await context.params

    if (!isPlatformSlug(slug)) {
      return errorJson({ message: "Plataforma no soportada" }, 400)
    }

    const masked = await getMaskedPlatformAppCredentials(workspaceId, slug)
    const canUseCustomCredentials = await hasFeature(
      workspaceId,
      "customIntegrations"
    )

    return json({
      slug,
      platform: platformFromSlug(slug),
      ...masked,
      canUseCustomCredentials,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    return errorJson(error)
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const ctx = await requireUserContext()
    await assertCustomIntegrationsAccess(ctx)
    const { slug } = await context.params

    if (!isPlatformSlug(slug)) {
      return errorJson({ message: "Plataforma no soportada" }, 400)
    }

    const input = putSchema.parse(await request.json())
    await setPlatformAppCredentials(ctx.workspaceId, slug, input)

    return json({ success: true })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    if (error instanceof PlanLimitError) {
      return errorJson(error, 403)
    }
    return errorJson(error)
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const ctx = await requireUserContext()
    await assertCustomIntegrationsAccess(ctx)
    const { slug } = await context.params

    if (!isPlatformSlug(slug)) {
      return errorJson({ message: "Plataforma no soportada" }, 400)
    }

    await deletePlatformAppCredentials(ctx.workspaceId, slug)
    return json({ success: true })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    if (error instanceof PlanLimitError) {
      return errorJson(error, 403)
    }
    return errorJson(error)
  }
}
