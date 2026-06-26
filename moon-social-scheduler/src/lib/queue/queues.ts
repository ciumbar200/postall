import { Queue } from "bullmq"
import { getRedisConnection } from "@/lib/queue/config"

export const publishQueueName = "moon:publish"

export type PublishJobData = {
  publishJobId: string
  postId: string
}

type PublishQueue = Queue<
  PublishJobData,
  unknown,
  string,
  PublishJobData,
  unknown,
  string
>

const globalForQueues = globalThis as unknown as {
  publishQueue?: PublishQueue
}

export function getPublishQueue(): PublishQueue {
  let queue = globalForQueues.publishQueue

  if (!queue) {
    queue = new Queue<
      PublishJobData,
      unknown,
      string,
      PublishJobData,
      unknown,
      string
    >(publishQueueName, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 60_000,
        },
        removeOnComplete: 500,
        removeOnFail: 1000,
      },
    })
    globalForQueues.publishQueue = queue
  }

  return queue
}

export async function enqueuePublishJob(input: {
  publishJobId: string
  postId: string
  runAt: Date
}) {
  const queue = getPublishQueue()
  const delay = Math.max(0, input.runAt.getTime() - Date.now())

  const job = await queue.add(
    "publish-post",
    {
      publishJobId: input.publishJobId,
      postId: input.postId,
    },
    {
      delay,
      jobId: input.publishJobId,
    }
  )

  return job
}
