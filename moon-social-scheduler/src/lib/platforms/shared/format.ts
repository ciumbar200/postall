import type { Platform } from "@/lib/domain/enums"
import type { PublishPostInput } from "@/lib/platforms/types"
import { assertValidPost } from "@/lib/platforms/validation"

export function genericFormat(platform: Platform) {
  return {
    validate(input: PublishPostInput) {
      assertValidPost(platform, {
        text: input.text,
        media: input.media,
        settings: input.settings,
      })
    },
    toApiPayload(input: PublishPostInput): Record<string, unknown> {
      return {
        text: input.text,
        media: input.media.map((media) => ({
          type: media.type,
          url: media.publicUrl,
          mimeType: media.mimeType,
        })),
      }
    },
  }
}
