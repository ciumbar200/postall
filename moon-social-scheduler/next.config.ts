import type { NextConfig } from "next"
import path from "node:path"
import { fileURLToPath } from "node:url"

/** Evita que Next infiera mal el root (p. ej. ~/package-lock.json). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  /** Evita que el tracer/webpack infiera ~/ como monorepo root. */
  outputFileTracingRoot: projectRoot,
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: projectRoot,
  },
}

export default nextConfig
