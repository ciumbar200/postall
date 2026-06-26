import { createRequire } from "node:module"
import { loadEnvConfig } from "@next/env"
import { PrismaClient } from "@/generated/prisma/client"

loadEnvConfig(process.cwd())

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

function createPrismaClient() {
  const require = createRequire(import.meta.url)
  const { PrismaPg } = require("@prisma/adapter-pg") as {
    PrismaPg: new (options: { connectionString: string }) => import("@prisma/adapter-pg").PrismaPgAdapter
  }
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("Missing required environment variable: DATABASE_URL")
  }

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
