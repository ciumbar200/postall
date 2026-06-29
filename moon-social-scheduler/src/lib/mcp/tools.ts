import { prisma } from "@/lib/db/client"
import {
  createPostForWorkspace,
  getPostStatusForWorkspace,
} from "@/lib/posts/service"
import { runBrandAgent, getBrandProfile, updateBrandProfile } from "@/lib/agent/brand-agent"
import { reviseContentStrategy } from "@/lib/agent/strategy-reviser"
import { invokeConnector } from "@/lib/connectors/invoke"
import { ConnectorType, AssetKind, Platform } from "@/generated/prisma/enums"

export type McpTool = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler: (workspaceId: string, args: Record<string, unknown>) => Promise<unknown>
}

async function firstMemberId(workspaceId: string) {
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  })
  if (!member) throw new Error("Workspace has no members")
  return member.userId
}

export const mcpTools: McpTool[] = [
  {
    name: "list_accounts",
    description: "Lista las cuentas sociales conectadas del workspace.",
    inputSchema: { type: "object", properties: {} },
    handler: async (workspaceId) => {
      const accounts = await prisma.socialAccount.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" },
      })
      return accounts.map((account) => ({
        id: account.id,
        platform: account.platform,
        username: account.username,
        status: account.status,
      }))
    },
  },
  {
    name: "upload_media",
    description: "Registra un archivo de medios a partir de una URL pública para usarlo en posts.",
    inputSchema: {
      type: "object",
      required: ["url"],
      properties: {
        url: { type: "string", description: "URL pública del archivo" },
        fileName: { type: "string" },
        mimeType: { type: "string" },
        type: { type: "string", enum: ["IMAGE", "GIF", "VIDEO"] },
      },
    },
    handler: async (workspaceId, args) => {
      const uploaderId = await firstMemberId(workspaceId)
      const mimeType = (args.mimeType as string) || "application/octet-stream"
      const type =
        (args.type as "IMAGE" | "GIF" | "VIDEO" | undefined) ??
        (mimeType.startsWith("video/")
          ? "VIDEO"
          : mimeType === "image/gif"
            ? "GIF"
            : "IMAGE")
      const url = args.url as string
      const asset = await prisma.mediaAsset.create({
        data: {
          workspaceId,
          uploaderId,
          type,
          fileName: (args.fileName as string) || "media",
          mimeType,
          byteSize: BigInt(0),
          storageKey: `external/${url}`,
          publicUrl: url,
        },
      })
      return { id: asset.id, publicUrl: asset.publicUrl, type: asset.type }
    },
  },
  {
    name: "schedule_post",
    description: "Crea y programa un post para una o varias cuentas conectadas.",
    inputSchema: {
      type: "object",
      required: ["text", "targetAccountIds"],
      properties: {
        text: { type: "string" },
        scheduledAt: { type: "string", description: "ISO 8601; omitir para borrador" },
        targetAccountIds: { type: "array", items: { type: "string" } },
        mediaAssetIds: { type: "array", items: { type: "string" } },
      },
    },
    handler: async (workspaceId, args) => {
      const creatorId = await firstMemberId(workspaceId)
      const { post, publishJob } = await createPostForWorkspace(workspaceId, creatorId, {
        baseText: args.text as string,
        scheduledAt: (args.scheduledAt as string) ?? null,
        targetAccountIds: (args.targetAccountIds as string[]) ?? [],
        mediaAssetIds: (args.mediaAssetIds as string[]) ?? [],
      })
      return { postId: post.id, status: post.status, publishJobId: publishJob?.id ?? null }
    },
  },
  {
    name: "publish_now",
    description: "Publica un post inmediatamente en las cuentas indicadas.",
    inputSchema: {
      type: "object",
      required: ["text", "targetAccountIds"],
      properties: {
        text: { type: "string" },
        targetAccountIds: { type: "array", items: { type: "string" } },
        mediaAssetIds: { type: "array", items: { type: "string" } },
      },
    },
    handler: async (workspaceId, args) => {
      const creatorId = await firstMemberId(workspaceId)
      const { post, publishJob } = await createPostForWorkspace(workspaceId, creatorId, {
        baseText: args.text as string,
        targetAccountIds: (args.targetAccountIds as string[]) ?? [],
        mediaAssetIds: (args.mediaAssetIds as string[]) ?? [],
        publishNow: true,
      })
      return { postId: post.id, status: post.status, publishJobId: publishJob?.id ?? null }
    },
  },
  {
    name: "get_post_status",
    description: "Obtiene el estado de publicación de un post por su id.",
    inputSchema: {
      type: "object",
      required: ["postId"],
      properties: { postId: { type: "string" } },
    },
    handler: async (workspaceId, args) => {
      const status = await getPostStatusForWorkspace(workspaceId, args.postId as string)
      if (!status) throw new Error("Post not found")
      return status
    },
  },
  {
    name: "get_analytics",
    description: "Devuelve métricas agregadas por plataforma para el workspace.",
    inputSchema: { type: "object", properties: {} },
    handler: async (workspaceId) => {
      const grouped = await prisma.analyticsMetric.groupBy({
        by: ["platform", "metric"],
        where: { workspaceId },
        _sum: { value: true },
      })
      return grouped.map((row) => ({
        platform: row.platform,
        metric: row.metric,
        value: row._sum.value ?? 0,
      }))
    },
  },
  {
    name: "run_brand_agent",
    description: "Ejecuta el Agente de Marca para generar una campaña completa desde un brief.",
    inputSchema: {
      type: "object",
      required: ["brief"],
      properties: {
        brief: { type: "string", description: "Descripción de la campaña a generar" },
        platforms: {
          type: "array",
          items: { type: "string", enum: ["INSTAGRAM", "TIKTOK", "LINKEDIN", "PINTEREST", "X", "FACEBOOK"] },
          description: "Plataformas objetivo"
        },
        scheduleStart: { type: "string", description: "Fecha de inicio (ISO 8601)" },
        horizonWeeks: { type: "number", enum: [4, 12] },
        postsPerWeek: { type: "number", minimum: 1, maximum: 14 },
      },
    },
    handler: async (workspaceId, args) => {
      const userId = await firstMemberId(workspaceId)
      return runBrandAgent({
        workspaceId,
        userId,
        brief: args.brief as string,
        platforms: (args.platforms as Platform[]) || [Platform.INSTAGRAM],
        scheduleStart: args.scheduleStart ? new Date(args.scheduleStart as string) : undefined,
        horizonWeeks: (args.horizonWeeks as 4 | 12) || 4,
        postsPerWeek: (args.postsPerWeek as number) || 3,
      })
    },
  },
  {
    name: "revise_content_plan",
    description: "Analiza métricas y propone ajustes de estrategia de contenido.",
    inputSchema: {
      type: "object",
      properties: {
        lookbackDays: { type: "number", minimum: 7, maximum: 90 },
      },
    },
    handler: async (workspaceId, args) =>
      reviseContentStrategy({
        workspaceId,
        lookbackDays: (args.lookbackDays as number) || 28,
      }),
  },
  {
    name: "generate_image",
    description: "Genera una imagen vía conector IMAGE_GEN y devuelve el MediaAsset.",
    inputSchema: {
      type: "object",
      required: ["prompt"],
      properties: {
        prompt: { type: "string" },
        aspectRatio: { type: "string" },
      },
    },
    handler: async (workspaceId, args) => {
      const userId = await firstMemberId(workspaceId)
      const result = await invokeConnector({
        workspaceId,
        uploaderId: userId,
        connector: ConnectorType.IMAGE_GEN,
        kind: AssetKind.IMAGE,
        prompt: args.prompt as string,
        image: {
          prompt: args.prompt as string,
          aspectRatio: args.aspectRatio as string | undefined,
        },
      })
      if (!result) throw new Error("IMAGE_GEN not configured")
      return result
    },
  },
  {
    name: "generate_video",
    description: "Genera un video HeyGen (async; usar poll-videos cron para completar).",
    inputSchema: {
      type: "object",
      required: ["script"],
      properties: {
        script: { type: "string" },
        avatarId: { type: "string" },
        voiceId: { type: "string" },
      },
    },
    handler: async (workspaceId, args) => {
      const userId = await firstMemberId(workspaceId)
      const result = await invokeConnector({
        workspaceId,
        uploaderId: userId,
        connector: ConnectorType.HEYGEN,
        kind: AssetKind.VIDEO,
        prompt: args.script as string,
        video: {
          script: args.script as string,
          avatarId: args.avatarId as string | undefined,
          voiceId: args.voiceId as string | undefined,
        },
      })
      if (!result) throw new Error("HEYGEN not configured")
      return result
    },
  },
  {
    name: "get_brand_profile",
    description: "Obtiene el perfil de marca del workspace.",
    inputSchema: { type: "object", properties: {} },
    handler: async (workspaceId) => getBrandProfile(workspaceId),
  },
  {
    name: "update_brand_profile",
    description: "Actualiza el perfil de marca del workspace.",
    inputSchema: {
      type: "object",
      properties: {
        voice: { type: "string" },
        tone: { type: "string" },
        audience: { type: "string" },
        keywords: { type: "array", items: { type: "string" } },
        bannedWords: { type: "array", items: { type: "string" } },
        sampleCaptions: { type: "array", items: { type: "string" } },
      },
    },
    handler: async (workspaceId, args) =>
      updateBrandProfile(workspaceId, {
        voice: args.voice as string | undefined,
        tone: args.tone as string | undefined,
        audience: args.audience as string | undefined,
        keywords: args.keywords as string[] | undefined,
        bannedWords: args.bannedWords as string[] | undefined,
        sampleCaptions: args.sampleCaptions as string[] | undefined,
      }),
  },
]

export function findTool(name: string) {
  return mcpTools.find((tool) => tool.name === name) ?? null
}
