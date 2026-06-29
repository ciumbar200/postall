export function isMissingTableError(error: unknown, table?: string) {
  if (!(error instanceof Error)) return false
  if (!error.message.includes("does not exist")) return false
  if (table && !error.message.includes(table)) return false
  return true
}
