type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export function toPrismaJson(value: unknown): JsonValue | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  return JSON.parse(JSON.stringify(value)) as JsonValue
}
