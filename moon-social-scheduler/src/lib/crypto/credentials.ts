import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const ENCRYPTION_KEY =
  process.env.CREDENTIAL_ENCRYPTION_KEY ||
  process.env.CONNECTOR_ENCRYPTION_KEY ||
  ""
const ALGO = "aes-256-gcm"

export function isEncryptionEnabled(): boolean {
  return Boolean(ENCRYPTION_KEY)
}

export function encryptCredentialPayload(text: string): string {
  if (!ENCRYPTION_KEY) return text
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGO, Buffer.from(ENCRYPTION_KEY, "hex"), iv)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  const authTag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`
}

export function decryptCredentialPayload(encrypted: string): string {
  if (!ENCRYPTION_KEY || !encrypted.includes(":")) return encrypted
  const [ivHex, authTagHex, encryptedText] = encrypted.split(":")
  if (!encryptedText) return encrypted
  const decipher = createDecipheriv(
    ALGO,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    Buffer.from(ivHex, "hex")
  )
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"))
  let decrypted = decipher.update(encryptedText, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

export function serializeCredential<T extends Record<string, unknown>>(cred: T): object {
  if (!ENCRYPTION_KEY) return cred
  return encryptCredentialPayload(JSON.stringify(cred)) as unknown as object
}

export function parseStoredCredential<T extends Record<string, unknown>>(
  credentialsJson: unknown
): T | null {
  if (!credentialsJson) return null
  try {
    if (typeof credentialsJson === "object" && credentialsJson !== null) {
      const obj = credentialsJson as Record<string, unknown>
      if (
        typeof obj.clientId === "string" ||
        typeof obj.apiKey === "string" ||
        typeof obj.accessToken === "string"
      ) {
        return obj as T
      }
    }
    const raw =
      typeof credentialsJson === "string"
        ? credentialsJson
        : JSON.stringify(credentialsJson)
    const decrypted = decryptCredentialPayload(raw)
    return JSON.parse(decrypted) as T
  } catch {
    return null
  }
}

export function maskSecret(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  if (value.length <= 4) return "••••"
  return `••••${value.slice(-4)}`
}
