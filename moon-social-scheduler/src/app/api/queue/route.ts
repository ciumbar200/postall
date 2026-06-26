import { z } from "zod"
import { Platform, QueueSlotStatus } from "@/generated/prisma/enums"
import { errorJson, json } from "@/lib/api/response"
import { listQueue, upsertQueueSlot } from "@/lib/local-dev/store"

const platformValues = Object.values(Platform) as [Platform, ...Platform[]]

const queueSlotSchema = z.object({
  platform: z.enum(platformValues),
  dayOfWeek: z.number().int().min(0).max(6),
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().default("UTC"),
  status: z.enum([QueueSlotStatus.ACTIVE, QueueSlotStatus.PAUSED]).default(QueueSlotStatus.ACTIVE),
})

export async function GET() {
  try {
    return json(listQueue())
  } catch (error) {
    return errorJson(error)
  }
}

export async function POST(request: Request) {
  try {
    const input = queueSlotSchema.parse(await request.json())
    const slot = upsertQueueSlot(input)
    return json({ slot }, { status: 201 })
  } catch (error) {
    return errorJson(error)
  }
}
