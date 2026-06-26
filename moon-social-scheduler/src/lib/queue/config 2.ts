import IORedis from "ioredis"
import { optionalEnv } from "@/lib/env"

const globalForRedis = globalThis as unknown as {
  redisConnection?: IORedis
}

export function getRedisConnection() {
  if (!globalForRedis.redisConnection) {
    globalForRedis.redisConnection = new IORedis(optionalEnv("REDIS_URL", "redis://localhost:6379"), {
      maxRetriesPerRequest: null,
    })
  }

  return globalForRedis.redisConnection
}
