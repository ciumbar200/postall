import { errorJson, json } from "@/lib/api/response"
import { listAccounts, revokeAccount } from "@/lib/local-dev/store"

export async function GET() {
  try {
    return json({ accounts: listAccounts() })
  } catch (error) {
    return errorJson(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = (await request.json()) as { id?: string }

    if (!id) {
      return errorJson(new Error("Missing account id."), 400)
    }

    revokeAccount(id)

    return json({ ok: true })
  } catch (error) {
    return errorJson(error)
  }
}
