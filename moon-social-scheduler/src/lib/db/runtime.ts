export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL)
}
