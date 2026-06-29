import { Platform } from "@/lib/domain/enums"
import type { PublishPostInput } from "@/lib/platforms/types"
import { assertValidPost } from "@/lib/platforms/validation"

export function validateInstagramPost(input: PublishPostInput): void {
  assertValidPost(Platform.INSTAGRAM, {
    text: input.text,
    media: input.media,
    settings: input.settings,
  })
}

export function toInstagramContainerPayload(
  input: PublishPostInput
): Record<string, unknown> {
  validateInstagramPost(input)

  const firstMedia = input.media[0]

  if (firstMedia.type === "VIDEO") {
    return {
      media_type: "REELS",
      video_url: firstMedia.publicUrl,
      caption: input.text,
      share_to_feed: input.settings?.shareToFeed ?? true,
    }
  }

  if (input.media.length === 1) {
    return {
      image_url: firstMedia.publicUrl,
      caption: input.text,
    }
  }

  return {
    media_type: "CAROUSEL",
    caption: input.text,
  }
}
