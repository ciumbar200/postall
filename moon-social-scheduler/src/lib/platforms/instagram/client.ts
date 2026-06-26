import { optionalEnv, requiredEnv } from "@/lib/env"

const defaultApiVersion = "v25.0"

type RequestOptions = {
  token?: string
  method?: "GET" | "POST"
  body?: Record<string, unknown>
  searchParams?: Record<string, string | number | boolean | undefined>
}

export class InstagramApiClient {
  private readonly apiVersion = optionalEnv(
    "INSTAGRAM_GRAPH_API_VERSION",
    defaultApiVersion
  )

  private readonly graphBase = optionalEnv(
    "INSTAGRAM_GRAPH_API_BASE",
    "https://graph.instagram.com"
  )

  private url(path: string, params?: RequestOptions["searchParams"]) {
    const base = path.startsWith("http")
      ? path
      : `${this.graphBase}/${this.apiVersion}${path}`
    const url = new URL(base)

    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }

    return url
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await fetch(this.url(path, options.searchParams), {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    const payload = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null

    if (!response.ok) {
      const message =
        typeof payload?.error === "object" && payload.error !== null
          ? JSON.stringify(payload.error)
          : response.statusText
      throw new Error(`Instagram API error ${response.status}: ${message}`)
    }

    return payload as T
  }

  async exchangeShortLivedToken(shortLivedToken: string): Promise<{
    access_token: string
    token_type?: string
    expires_in?: number
  }> {
    const url = new URL(`${this.graphBase}/access_token`)
    url.searchParams.set("grant_type", "ig_exchange_token")
    url.searchParams.set("client_secret", requiredEnv("INSTAGRAM_APP_SECRET"))
    url.searchParams.set("access_token", shortLivedToken)

    const response = await fetch(url, { headers: { Accept: "application/json" } })
    const payload = (await response.json()) as {
      access_token?: string
      token_type?: string
      expires_in?: number
      error?: unknown
    }

    if (!response.ok || !payload.access_token) {
      throw new Error(`Instagram token exchange failed: ${JSON.stringify(payload)}`)
    }

    return {
      access_token: payload.access_token,
      token_type: payload.token_type,
      expires_in: payload.expires_in,
    }
  }
}

export const instagramClient = new InstagramApiClient()
