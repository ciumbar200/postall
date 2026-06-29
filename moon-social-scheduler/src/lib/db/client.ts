import { createRequire } from "node:module"
import { loadEnvConfig } from "@next/env"
import { PrismaClient } from "@/generated/prisma/client"

loadEnvConfig(process.cwd())

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

function withConnectionTimeout(connectionString: string) {
  if (connectionString.includes("connect_timeout")) {
    return connectionString
  }
  const separator = connectionString.includes("?") ? "&" : "?"
  const timeout = process.env.NODE_ENV === "development" ? "3" : "10"
  return `${connectionString}${separator}connect_timeout=${timeout}`
}

function createPrismaClient() {
  const require = createRequire(import.meta.url)
  const { PrismaPg } = require("@prisma/adapter-pg") as {
    PrismaPg: new (options: { connectionString: string }) => any
  }
  const raw = process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL
  if (!raw) {
    throw new Error("Missing required environment variable: DATABASE_URL")
  }
  const connectionString = withConnectionTimeout(raw)

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }

  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient()
    const value = Reflect.get(client as object, prop, receiver)

    return typeof value === "function" ? value.bind(client) : value
  },
}) as PrismaClient
