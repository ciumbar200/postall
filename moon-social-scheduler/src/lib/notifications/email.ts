import { optionalEnv } from "@/lib/env"

export function hasEmailEnv() {
  return Boolean(process.env.RESEND_API_KEY)
}

type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { skipped: true as const }
  }

  const from = optionalEnv("EMAIL_FROM", "Postall <notifications@postall.app>")

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`Resend email failed (${response.status}): ${detail}`)
  }

  return { skipped: false as const }
}
