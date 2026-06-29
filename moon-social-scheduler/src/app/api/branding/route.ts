import { z } from "zod"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { isDatabaseConfigured } from "@/lib/db/runtime"
import { assertFeature, hasFeature, PlanLimitError } from "@/lib/billing/subscription"

export const runtime = "nodejs"

export async function GET() {
  try {
    const { workspace } = await requireUserContext()
    const branding = await prisma.workspaceBranding.findUnique({
      where: { workspaceId: workspace.id },
    })
    const enabled = await hasFeature(workspace.id, "whiteLabel")

    return json({
      enabled,
      branding: branding
        ? {
            brandName: branding.brandName,
            logoUrl: branding.logoUrl,
            primaryColor: branding.primaryColor,
            customDomain: branding.customDomain,
            supportEmail: branding.supportEmail,
            hidePostallBranding: branding.hidePostallBranding,
          }
        : null,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorJson(error, 401)
    if (isDatabaseConfigured()) return errorJson(error)
    return json({ enabled: false, branding: null })
  }
}

const schema = z.object({
  brandName: z.string().max(60).nullish(),
  logoUrl: z.string().url().nullish().or(z.literal("")),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullish()
    .or(z.literal("")),
  customDomain: z.string().max(255).nullish().or(z.literal("")),
  supportEmail: z.string().email().nullish().or(z.literal("")),
  hidePostallBranding: z.boolean().optional(),
})

export async function PUT(request: Request) {
  try {
    const { workspace } = await requireUserContext()
    await assertFeature(workspace.id, "whiteLabel")
    const input = schema.parse(await request.json())

    const data = {
      brandName: input.brandName || null,
      logoUrl: input.logoUrl || null,
      primaryColor: input.primaryColor || null,
      customDomain: input.customDomain || null,
      supportEmail: input.supportEmail || null,
      hidePostallBranding: input.hidePostallBranding ?? false,
    }

    const branding = await prisma.workspaceBranding.upsert({
      where: { workspaceId: workspace.id },
      update: data,
      create: { workspaceId: workspace.id, ...data },
    })

    return json({ ok: true, brandName: branding.brandName })
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorJson(error, 401)
    if (error instanceof PlanLimitError) return errorJson(error, 402)
    return errorJson(error)
  }
}
