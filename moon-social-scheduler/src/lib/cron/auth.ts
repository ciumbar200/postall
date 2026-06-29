export function isAuthorizedCron(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // No secret configured: only allow in non-production to avoid open endpoints.
    return process.env.NODE_ENV !== "production"
  }

  const header = request.headers.get("authorization")
  if (header === `Bearer ${secret}`) {
    return true
  }

  const url = new URL(request.url)
  return url.searchParams.get("secret") === secret
}
