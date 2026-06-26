import { json } from "@/lib/api/response"

export async function GET() {
  return json({
    ok: true,
    mode: "local-demo",
  })
}

export async function POST() {
  return GET()
}
