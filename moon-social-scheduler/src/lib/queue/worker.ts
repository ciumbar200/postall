import { loadEnvConfig } from "@next/env"
import { Worker } from "bullmq"
import { PublishJobStatus } from "@/generated/prisma/enums"
import { prisma } from "@/lib/db/client"
import { publishPostJob } from "@/lib/posts/publishing"
import { getRedisConnection } from "@/lib/queue/config"
import { publishQueueName, type PublishJobData } from "@/lib/queue/queues"

loadEnvConfig(process.cwd())

const worker = new Worker<PublishJobData>(
  publishQueueName,
  async (job) => {
    try {
      return await publishPostJob(job.data.publishJobId)
    } catch (error) {
      const maxAttempts =
        typeof job.opts.attempts === "number" ? job.opts.attempts : 1
      const isFinalFailure = job.attemptsMade + 1 >= maxAttempts

      await prisma.publishJob.update({
        where: { id: job.data.publishJobId },
        data: {
          status: isFinalFailure
            ? PublishJobStatus.FAILED
            : PublishJobStatus.RETRYING,
          lastError: error instanceof Error ? error.message : String(error),
        },
      })
      throw error
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 3),
  }
)

worker.on("completed", (job) => {
  console.log(`[publish-worker] completed ${job.id}`)
})

worker.on("failed", (job, error) => {
  console.error(`[publish-worker] failed ${job?.id}:`, error)
})

process.on("SIGINT", async () => {
  await worker.close()
  await prisma.$disconnect()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  await worker.close()
  await prisma.$disconnect()
  process.exit(0)
})
