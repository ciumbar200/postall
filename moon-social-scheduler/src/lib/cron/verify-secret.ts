// ponytail: verifica CRON_SECRET para endpoints de cron
import { PlanLimitError } from "@/lib/billing/subscription"

export async function verifyCronSecret(request: Request): Promise<void> {
  const auth = request.headers.get("authorization")
  const token = auth?.replace("Bearer ", "")

  if (token !== process.env.CRON_SECRET) {
    throw new PlanLimitError("Invalid cron secret")
  }
}
