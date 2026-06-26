import { instagramClient } from "@/lib/platforms/instagram/client"
import {
  toInstagramContainerPayload,
  validateInstagramPost,
} from "@/lib/platforms/instagram/formatter"
import type {
  PublishPostInput,
  PublishPostResult,
} from "@/lib/platforms/types"

type ContainerResponse = {
  id: string
}

type PublishResponse = {
  id: string
}

async function createContainer(
  igUserId: string,
  accessToken: string,
  body: Record<string, unknown>
) {
  return instagramClient.request<ContainerResponse>(`/${igUserId}/media`, {
    method: "POST",
    token: accessToken,
    body,
  })
}

export async function publishInstagramPost(
  input: PublishPostInput
): Promise<PublishPostResult> {
  validateInstagramPost(input)

  const igUserId =
    (input.account.metadata?.instagramUserId as string | undefined) ??
    input.account.providerAccountId

  let creationId: string

  if (input.media.length > 1 && input.media[0].type !== "VIDEO") {
    const children = await Promise.all(
      input.media.map((media) =>
        createContainer(igUserId, input.account.accessToken, {
          image_url: media.publicUrl,
          is_carousel_item: true,
        })
      )
    )

    const parent = await createContainer(igUserId, input.account.accessToken, {
      ...toInstagramContainerPayload(input),
      children: children.map((child) => child.id).join(","),
    })
    creationId = parent.id
  } else {
    const container = await createContainer(
      igUserId,
      input.account.accessToken,
      toInstagramContainerPayload(input)
    )
    creationId = container.id
  }

  const published = await instagramClient.request<PublishResponse>(
    `/${igUserId}/media_publish`,
    {
      method: "POST",
      token: input.account.accessToken,
      body: {
        creation_id: creationId,
      },
    }
  )

  return {
    externalPostId: published.id,
    externalUrl: `https://www.instagram.com/p/${published.id}`,
    raw: {
      creationId,
      published,
    },
  }
}
