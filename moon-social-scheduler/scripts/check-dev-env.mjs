#!/usr/bin/env node
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const cwd = process.cwd()
const homeLock = path.join(os.homedir(), "package-lock.json")
const homePkg = path.join(os.homedir(), "package.json")

if (fs.existsSync(homeLock)) {
  const orphan = !fs.existsSync(homePkg)
  const inHomeProject = fs.existsSync(homePkg)
  if (orphan || inHomeProject) {
    console.warn(`
⚠️  Postall dev: hay package-lock.json en ${homeLock}${inHomeProject ? " (proyecto npm en ~)" : " (huérfano)"}.

Si \`next dev\` se queda colgado, libera espacio en disco y evita npm en home.
Workaround: npm run dev:stable
`)
  }
}

const parent = path.dirname(cwd)
const parentLock = path.join(parent, "package-lock.json")
if (parentLock !== path.join(cwd, "package-lock.json") && fs.existsSync(parentLock)) {
  console.warn(`
ℹ️  Hay package-lock.json en ${parent}. Si dev va lento, usa turbopack.root / outputFileTracingRoot en next.config.ts (ya configurado).
`)
}

console.log("✓ Entorno dev OK")
