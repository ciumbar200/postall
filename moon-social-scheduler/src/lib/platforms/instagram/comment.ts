import { instagramClient } from "@/lib/platforms/instagram/client"
import type { PublishCommentInput } from "@/lib/platforms/types"

export async function publishInstagramComment(
  input: PublishCommentInput
): Promise<void> {
  await instagramClient.request(`/${input.externalPostId}/comments`, {
    method: "POST",
    token: input.account.accessToken,
    body: { message: input.text },
  })
}
