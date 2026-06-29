import { Platform } from "@/lib/domain/enums"
import type { PlatformMedia } from "@/lib/platforms/types"

export type ValidationInput = {
  text: string
  media: Pick<PlatformMedia, "type" | "mimeType" | "byteSize">[]
  settings?: Record<string, unknown> | null
}

export type ValidationIssue = {
  level: "error" | "warning"
  code: string
  message: string
}

export type ValidationResult = {
  platform: Platform
  ok: boolean
  issues: ValidationIssue[]
}

type PlatformRules = {
  captionLimit: number
  hashtagLimit?: number
  requiresMedia: boolean
  maxMedia: number
  minMedia?: number
  imageMimeTypes?: string[]
  videoMimeTypes?: string[]
  maxImageBytes?: number
  maxVideoBytes?: number
  validate?: (input: ValidationInput, push: (issue: ValidationIssue) => void) => void
}

const MB = 1024 * 1024

function countHashtags(text: string) {
  return (text.match(/#[\p{L}0-9_]+/gu) ?? []).length
}

export const platformRules: Partial<Record<Platform, PlatformRules>> = {
  [Platform.INSTAGRAM]: {
    captionLimit: 2200,
    hashtagLimit: 30,
    requiresMedia: true,
    maxMedia: 10,
    minMedia: 1,
    imageMimeTypes: ["image/jpeg", "image/png"],
    videoMimeTypes: ["video/mp4", "video/quicktime"],
    maxImageBytes: 8 * MB,
    maxVideoBytes: 1024 * MB,
    validate: (input, push) => {
      const hasGif = input.media.some((m) => m.type === "GIF")
      if (hasGif) {
        push({ level: "error", code: "IG_NO_GIF", message: "Instagram no admite GIF directamente; conviértelo a vídeo MP4." })
      }
    },
  },
  [Platform.TIKTOK]: {
    captionLimit: 2200,
    requiresMedia: true,
    maxMedia: 35,
    minMedia: 1,
    imageMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    videoMimeTypes: ["video/mp4", "video/quicktime", "video/webm"],
    maxVideoBytes: 4096 * MB,
    validate: (input, push) => {
      const privacy = input.settings?.privacyLevel
      if (!privacy) {
        push({
          level: "warning",
          code: "TT_PRIVACY",
          message:
            "TikTok exige un privacy_level válido de creator_info. Mientras la app no esté auditada, se publica como SELF_ONLY.",
        })
      }
      const hasVideo = input.media.some((m) => m.type === "VIDEO")
      if (hasVideo) {
        push({
          level: "warning",
          code: "TT_RATIO",
          message: "Para vídeo, TikTok recomienda formato vertical 9:16 (1080x1920) en MP4 H.264.",
        })
      }
    },
  },
  [Platform.YOUTUBE]: {
    captionLimit: 5000,
    requiresMedia: true,
    maxMedia: 1,
    minMedia: 1,
    videoMimeTypes: ["video/mp4", "video/quicktime", "video/webm"],
    validate: (input, push) => {
      if (!input.media.some((m) => m.type === "VIDEO")) {
        push({ level: "error", code: "YT_VIDEO", message: "YouTube requiere un único archivo de vídeo." })
      }
    },
  },
  [Platform.LINKEDIN]: {
    captionLimit: 3000,
    requiresMedia: false,
    maxMedia: 9,
  },
  [Platform.FACEBOOK]: {
    captionLimit: 63206,
    requiresMedia: false,
    maxMedia: 10,
  },
  [Platform.THREADS]: {
    captionLimit: 500,
    requiresMedia: false,
    maxMedia: 10,
  },
  [Platform.BLUESKY]: {
    captionLimit: 300,
    requiresMedia: false,
    maxMedia: 4,
    imageMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxImageBytes: 1 * MB,
  },
  [Platform.TELEGRAM]: {
    captionLimit: 4096,
    requiresMedia: false,
    maxMedia: 10,
  },
}

export function validatePost(platform: Platform, input: ValidationInput): ValidationResult {
  const rules = platformRules[platform]
  const issues: ValidationIssue[] = []
  const push = (issue: ValidationIssue) => issues.push(issue)

  if (!rules) {
    return { platform, ok: true, issues }
  }

  if (input.text.length > rules.captionLimit) {
    push({
      level: "error",
      code: "CAPTION_LIMIT",
      message: `El texto supera el límite de ${rules.captionLimit} caracteres (${input.text.length}).`,
    })
  }

  if (rules.hashtagLimit) {
    const count = countHashtags(input.text)
    if (count > rules.hashtagLimit) {
      push({
        level: "error",
        code: "HASHTAG_LIMIT",
        message: `Demasiados hashtags (${count}). Máximo ${rules.hashtagLimit}.`,
      })
    }
  }

  if (rules.requiresMedia && input.media.length === 0) {
    push({ level: "error", code: "MEDIA_REQUIRED", message: "Esta plataforma requiere al menos un archivo de medios." })
  }

  if (input.media.length > rules.maxMedia) {
    push({
      level: "error",
      code: "MEDIA_MAX",
      message: `Demasiados archivos (${input.media.length}). Máximo ${rules.maxMedia}.`,
    })
  }

  if (rules.minMedia && input.media.length > 0 && input.media.length < rules.minMedia) {
    push({
      level: "error",
      code: "MEDIA_MIN",
      message: `Se requieren al menos ${rules.minMedia} archivos.`,
    })
  }

  for (const media of input.media) {
    if (media.type === "IMAGE" && rules.imageMimeTypes && !rules.imageMimeTypes.includes(media.mimeType)) {
      push({
        level: "warning",
        code: "IMAGE_FORMAT",
        message: `Formato de imagen ${media.mimeType} puede no ser compatible. Recomendado: ${rules.imageMimeTypes.join(", ")}.`,
      })
    }
    if (media.type === "VIDEO" && rules.videoMimeTypes && !rules.videoMimeTypes.includes(media.mimeType)) {
      push({
        level: "warning",
        code: "VIDEO_FORMAT",
        message: `Formato de vídeo ${media.mimeType} puede no ser compatible. Recomendado: ${rules.videoMimeTypes.join(", ")}.`,
      })
    }
    if (media.type === "IMAGE" && rules.maxImageBytes && Number(media.byteSize) > rules.maxImageBytes) {
      push({
        level: "warning",
        code: "IMAGE_SIZE",
        message: `La imagen supera el tamaño recomendado (${Math.round(rules.maxImageBytes / MB)} MB).`,
      })
    }
    if (media.type === "VIDEO" && rules.maxVideoBytes && Number(media.byteSize) > rules.maxVideoBytes) {
      push({
        level: "error",
        code: "VIDEO_SIZE",
        message: `El vídeo supera el tamaño máximo (${Math.round(rules.maxVideoBytes / MB)} MB).`,
      })
    }
  }

  rules.validate?.(input, push)

  return { platform, ok: !issues.some((issue) => issue.level === "error"), issues }
}

export function assertValidPost(platform: Platform, input: ValidationInput) {
  const result = validatePost(platform, input)
  const error = result.issues.find((issue) => issue.level === "error")
  if (error) {
    throw new Error(`[${platform}] ${error.message}`)
  }
}
