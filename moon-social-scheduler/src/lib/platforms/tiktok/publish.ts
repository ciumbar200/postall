import { tiktokClient } from "@/lib/platforms/tiktok/client"
import {
  toTikTokPayload,
  validateTikTokPost,
} from "@/lib/platforms/tiktok/formatter"
import type {
  PublishPostInput,
  PublishPostResult,
} from "@/lib/platforms/types"

type CreatorInfoResponse = {
  data?: {
    privacy_level_options?: string[]
    comment_disabled?: boolean
    duet_disabled?: boolean
    stitch_disabled?: boolean
    max_video_post_duration_sec?: number
  }
  error?: {
    code: string
    message: string
    log_id?: string
  }
}

type TikTokInitResponse = {
  data?: {
    publish_id?: string
    upload_url?: string
  }
  error?: {
    code: string
    message: string
    log_id?: string
  }
}

export async function queryTikTokCreatorInfo(accessToken: string) {
  const response = await tiktokClient.request<CreatorInfoResponse>(
    "/v2/post/publish/creator_info/query/",
    {
      method: "POST",
      token: accessToken,
      body: {},
    }
  )

  if (response.error?.code && response.error.code !== "ok") {
    throw new Error(`TikTok creator info failed: ${JSON.stringify(response.error)}`)
  }

  return response.data
}

export async function publishTikTokPost(
  input: PublishPostInput
): Promise<PublishPostResult> {
  validateTikTokPost(input)

  const creatorInfo = await queryTikTokCreatorInfo(input.account.accessToken)
  const payload = toTikTokPayload(input)
  const isVideo = input.media[0]?.type === "VIDEO"

  const endpoint = isVideo
    ? "/v2/post/publish/video/init/"
    : "/v2/post/publish/content/init/"

  const response = await tiktokClient.request<TikTokInitResponse>(endpoint, {
    method: "POST",
    token: input.account.accessToken,
    body: payload,
  })

  if (response.error?.code && response.error.code !== "ok") {
    throw new Error(`TikTok publish init failed: ${JSON.stringify(response.error)}`)
  }

  const publishId = response.data?.publish_id

  if (!publishId) {
    throw new Error(`TikTok did not return publish_id: ${JSON.stringify(response)}`)
  }

  return {
    externalPostId: publishId,
    raw: {
      creatorInfo,
      response,
    },
  }
}
