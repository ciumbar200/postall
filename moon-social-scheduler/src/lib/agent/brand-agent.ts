import { prisma } from "@/lib/db/client"
import {
  AgentRunStatus,
  AssetKind,
  ConnectorType,
  Platform,
  PostStatus,
  PublishTargetStatus,
} from "@/generated/prisma/enums"
import { generateTextAI, generateStructured, z } from "@/lib/ai/provider"
import {
  buildBrandAgentSystem,
  PLAN_PROMPT,
  CAPTION_PROMPT,
  IMAGE_PROMPT,
  VIDEO_SCRIPT_PROMPT,
} from "./prompts"
import type { BrandContext } from "@/lib/connectors/types"
import { invokeConnector, isConnectorReady } from "@/lib/connectors/invoke"
import { attachMediaToPost } from "@/lib/connectors/persist-asset"

const ContentPieceSchema = z.object({
  platform: z.enum([
    "INSTAGRAM",
    "TIKTOK",
    "LINKEDIN",
    "PINTEREST",
    "FACEBOOK",
    "X",
  ]),
  format: z.enum(["carousel", "reel", "static", "story"]),
  needsImage: z.boolean(),
  needsVideo: z.boolean(),
  captionBrief: z.string(),
  cta: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  weekNumber: z.number().int().min(1).max(12).optional(),
  pillar: z.string().optional(),
})

const PlanSchema = z.object({
  horizonWeeks: z.union([z.literal(4), z.literal(12)]).default(4),
  pieces: z.array(ContentPieceSchema),
  rationale: z.string(),
})

export type RunBrandAgentParams = {
  workspaceId: string
  userId: string
  brief: string
  platforms?: Platform[]
  scheduleStart?: Date
  horizonWeeks?: 4 | 12
  postsPerWeek?: number
}

async function ensureBrandProfile(workspaceId: string) {
  return prisma.brandProfile.upsert({
    where: { workspaceId },
    create: { workspaceId, pillars: {}, paletteJson: {} },
    update: {},
  })
}

function toBrandContext(brandProfile: {
  voice: string | null
  tone: string | null
  audience: string | null
  keywords: string[]
  bannedWords: string[]
  paletteJson: unknown
  sampleCaptions: string[]
}): BrandContext {
  return {
    voice: brandProfile.voice || undefined,
    tone: brandProfile.tone || undefined,
    audience: brandProfile.audience || undefined,
    keywords: brandProfile.keywords,
    bannedWords: brandProfile.bannedWords,
    paletteJson: brandProfile.paletteJson as BrandContext["paletteJson"],
    sampleCaptions: brandProfile.sampleCaptions,
  }
}

function aspectForFormat(format: string): string {
  if (format === "reel" || format === "story") return "9:16"
  if (format === "carousel") return "4:5"
  return "1:1"
}

function resolveScheduledAt(
  piece: z.infer<typeof ContentPieceSchema>,
  index: number,
  scheduleStart: Date,
  postsPerWeek: number
): Date {
  if (piece.scheduledAt) return new Date(piece.scheduledAt)

  const week = (piece.weekNumber ?? Math.floor(index / postsPerWeek) + 1) - 1
  const slotInWeek = index % postsPerWeek
  const daysBetween = Math.max(1, Math.floor(7 / postsPerWeek))
  const dayOffset = week * 7 + slotInWeek * daysBetween

  const date = new Date(scheduleStart)
  date.setUTCDate(date.getUTCDate() + dayOffset)
  date.setUTCHours(10 + (slotInWeek % 4) * 2, 0, 0, 0)
  return date
}

export async function runBrandAgent(params: RunBrandAgentParams) {
  const {
    workspaceId,
    userId,
    brief,
    platforms = [Platform.INSTAGRAM],
    scheduleStart = new Date(),
    horizonWeeks = 4,
    postsPerWeek = 3,
  } = params

  const brandProfile = await ensureBrandProfile(workspaceId)
  const brandContext = toBrandContext(brandProfile)

  const agentRun = await prisma.agentRun.create({
    data: {
      workspaceId,
      brief,
      status: AgentRunStatus.PLANNING,
      createdById: userId,
      brandProfileId: brandProfile.id,
    },
  })

  try {
    const plan = await generateStructured({
      schema: PlanSchema,
      prompt: PLAN_PROMPT({
        brief,
        platforms: platforms.map((p) => p.toLowerCase()),
        horizonWeeks,
        postsPerWeek,
        scheduleStart: scheduleStart.toISOString(),
      }),
      system: buildBrandAgentSystem(brandContext),
      workspaceId,
    })

    await prisma.agentRun.update({
      where: { id: agentRun.id },
      data: { planJson: plan as object, status: AgentRunStatus.GENERATING },
    })

    const [imageReady, videoReady] = await Promise.all([
      isConnectorReady(workspaceId, ConnectorType.IMAGE_GEN),
      isConnectorReady(workspaceId, ConnectorType.HEYGEN),
    ])

    const results: Array<Record<string, unknown>> = []

    for (const [index, piece] of plan.pieces.entries()) {
      const caption = await generateTextAI({
        system: buildBrandAgentSystem(brandContext),
        prompt: CAPTION_PROMPT(
          piece.platform.toLowerCase(),
          piece.captionBrief,
          brandContext
        ),
        temperature: 0.8,
        workspaceId,
      })

      const scheduledAt = resolveScheduledAt(
        piece,
        index,
        scheduleStart,
        postsPerWeek
      )

      const post = await prisma.post.create({
        data: {
          workspaceId,
          creatorId: userId,
          status: PostStatus.DRAFT,
          baseText: caption,
          scheduledAt,
        },
      })

      await prisma.postVersion.create({
        data: {
          postId: post.id,
          platform: piece.platform as Platform,
          text: caption,
        },
      })

      let mediaAssetId: string | undefined
      let generatedAssetId: string | undefined
      let videoPending = false

      if (piece.needsImage && imageReady) {
        const imagePrompt = await generateTextAI({
          prompt: IMAGE_PROMPT(caption, brandContext),
          system: "Eres un experto en prompting para generación de imágenes.",
          workspaceId,
        })
        const imageResult = await invokeConnector({
          workspaceId,
          uploaderId: userId,
          connector: ConnectorType.IMAGE_GEN,
          kind: AssetKind.IMAGE,
          prompt: imagePrompt,
          image: {
            prompt: imagePrompt,
            aspectRatio: aspectForFormat(piece.format),
          },
          brand: brandContext,
          meta: { postId: post.id, agentRunId: agentRun.id },
        })
        if (imageResult?.mediaAssetId) {
          mediaAssetId = imageResult.mediaAssetId
          generatedAssetId = imageResult.generatedAssetId
          await attachMediaToPost(post.id, mediaAssetId)
        }
      }

      if (piece.needsVideo && videoReady) {
        const script = await generateTextAI({
          system: buildBrandAgentSystem(brandContext),
          prompt: VIDEO_SCRIPT_PROMPT(piece.captionBrief, 30),
          workspaceId,
        })
        const videoResult = await invokeConnector({
          workspaceId,
          uploaderId: userId,
          connector: ConnectorType.HEYGEN,
          kind: AssetKind.VIDEO,
          prompt: script,
          video: { script, aspectRatio: aspectForFormat(piece.format) },
          brand: brandContext,
          meta: { postId: post.id, agentRunId: agentRun.id },
        })
        if (videoResult) {
          generatedAssetId = videoResult.generatedAssetId
          if (videoResult.mediaAssetId) {
            mediaAssetId = videoResult.mediaAssetId
            await attachMediaToPost(post.id, mediaAssetId)
          } else if (videoResult.status === "PENDING") {
            videoPending = true
          }
        }
      }

      results.push({
        platform: piece.platform,
        format: piece.format,
        caption,
        scheduledAt: scheduledAt.toISOString(),
        postId: post.id,
        mediaAssetId,
        generatedAssetId,
        videoPending,
        weekNumber: piece.weekNumber,
        pillar: piece.pillar,
      })
    }

    await prisma.agentRun.update({
      where: { id: agentRun.id },
      data: {
        status: AgentRunStatus.DRAFTED,
        resultJson: { results, connectors: { imageReady, videoReady } } as object,
      },
    })

    return { agentRunId: agentRun.id, plan, results }
  } catch (error) {
    await prisma.agentRun.update({
      where: { id: agentRun.id },
      data: {
        status: AgentRunStatus.FAILED,
        resultJson: { error: String(error) } as object,
      },
    })
    throw error
  }
}

export async function getBrandProfile(workspaceId: string) {
  return prisma.brandProfile.findUnique({
    where: { workspaceId },
    include: { workspace: true },
  })
}

export async function updateBrandProfile(
  workspaceId: string,
  data: {
    voice?: string
    tone?: string
    audience?: string
    pillars?: unknown
    keywords?: string[]
    bannedWords?: string[]
    paletteJson?: unknown
    fonts?: string[]
    sampleCaptions?: string[]
    logoMediaId?: string
  }
) {
  return prisma.brandProfile.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      ...data,
      paletteJson: data.paletteJson || {},
      pillars: data.pillars || {},
    },
    update: data,
  })
}

export async function listAgentRuns(workspaceId: string, limit = 20) {
  return prisma.agentRun.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
}
