import { optionalEnv } from "@/lib/env"

export function getRedisConnection() {
  const redisUrl = new URL(optionalEnv("REDIS_URL", "redis://localhost:6379"))

  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    db: redisUrl.pathname ? Number(redisUrl.pathname.slice(1) || 0) : 0,
    tls: redisUrl.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: null,
  }
}
