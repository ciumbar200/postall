export function json(data: unknown, init?: ResponseInit) {
  return new Response(
    JSON.stringify(data, (_key, value) => {
      if (typeof value === "bigint") {
        return value.toString()
      }

      return value
    }),
    {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    }
  )
}

export function errorJson(error: unknown, status = 500) {
  return json(
    {
      error: error instanceof Error ? error.message : String(error),
    },
    { status }
  )
}
