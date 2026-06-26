import type { PublishPostInput } from "@/lib/platforms/types"

export function validateInstagramPost(input: PublishPostInput): void {
  if (!input.media.length) {
    throw new Error("Instagram requires at least one image or video asset.")
  }

  if (input.text.length > 2200) {
    throw new Error("Instagram captions must be 2,200 characters or fewer.")
  }

  if (input.media.length > 10) {
    throw new Error("Instagram carousel posts support up to 10 media assets.")
  }
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
