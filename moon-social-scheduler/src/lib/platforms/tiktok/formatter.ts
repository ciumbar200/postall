import { Platform } from "@/lib/domain/enums"
import type { PublishPostInput } from "@/lib/platforms/types"
import { assertValidPost } from "@/lib/platforms/validation"

export function validateTikTokPost(input: PublishPostInput): void {
  assertValidPost(Platform.TIKTOK, {
    text: input.text,
    media: input.media,
    settings: input.settings,
  })
}

export function toTikTokPayload(input: PublishPostInput): Record<string, unknown> {
  validateTikTokPost(input)

  const firstMedia = input.media[0]
  const privacyLevel = input.settings?.privacyLevel ?? "SELF_ONLY"

  if (firstMedia.type === "VIDEO") {
    return {
      post_info: {
        title: input.text,
        privacy_level: privacyLevel,
        disable_duet: input.settings?.disableDuet ?? false,
        disable_comment: input.settings?.disableComment ?? false,
        disable_stitch: input.settings?.disableStitch ?? false,
        video_cover_timestamp_ms: input.settings?.videoCoverTimestampMs ?? 1000,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: firstMedia.publicUrl,
      },
    }
  }

  return {
    post_info: {
      title: input.text,
      description: input.text,
      privacy_level: privacyLevel,
      disable_comment: input.settings?.disableComment ?? false,
      auto_add_music: input.settings?.autoAddMusic ?? false,
    },
    source_info: {
      source: "PULL_FROM_URL",
      photo_cover_index: 0,
      photo_images: input.media.map((media) => media.publicUrl),
    },
    post_mode: "DIRECT_POST",
    media_type: "PHOTO",
  }
}
