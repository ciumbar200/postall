import { optionalEnv } from "@/lib/env"

type TikTokRequestOptions = {
  token?: string
  method?: "GET" | "POST" | "PUT"
  body?: Record<string, unknown>
  searchParams?: Record<string, string | number | boolean | undefined>
  headers?: HeadersInit
}

export class TikTokApiClient {
  private readonly apiBase = optionalEnv(
    "TIKTOK_API_BASE",
    "https://open.tiktokapis.com"
  )

  private url(path: string, params?: TikTokRequestOptions["searchParams"]) {
    const url = new URL(path.startsWith("http") ? path : `${this.apiBase}${path}`)

    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }

    return url
  }

  async request<T>(path: string, options: TikTokRequestOptions = {}): Promise<T> {
    const response = await fetch(this.url(path, options.searchParams), {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.body
          ? { "Content-Type": "application/json; charset=UTF-8" }
          : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    const payload = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null

    if (!response.ok) {
      throw new Error(`TikTok API error ${response.status}: ${JSON.stringify(payload)}`)
    }

    return payload as T
  }
}

export const tiktokClient = new TikTokApiClient()
