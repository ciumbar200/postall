import { z } from "zod"
import { Platform, QueueSlotStatus } from "@/lib/domain/enums"
import { errorJson, json } from "@/lib/api/response"
import { requireUserContext, UnauthorizedError } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { isDatabaseConfigured } from "@/lib/db/runtime"
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
    const { workspace } = await requireUserContext()
    const [jobs, slots] = await Promise.all([
      prisma.publishJob.findMany({
        where: {
          post: {
            workspaceId: workspace.id,
          },
        },
        include: {
          post: {
            include: {
              targets: true,
            },
          },
        },
        orderBy: { runAt: "asc" },
      }),
      prisma.queueSlot.findMany({
        where: { workspaceId: workspace.id },
        orderBy: [{ platform: "asc" }, { dayOfWeek: "asc" }, { timeOfDay: "asc" }],
      }),
    ])

    if (jobs.length > 0 || slots.length > 0) {
      return json({ jobs, slots })
    }

    return json(listQueue())
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    if (isDatabaseConfigured()) {
      return errorJson(error)
    }
    return json(listQueue())
  }
}

export async function POST(request: Request) {
  const payload = await request.json()

  try {
    const input = queueSlotSchema.parse(payload)
    const { workspace } = await requireUserContext()
    const slot = await prisma.queueSlot.upsert({
      where: {
        workspaceId_platform_dayOfWeek_timeOfDay: {
          workspaceId: workspace.id,
          platform: input.platform,
          dayOfWeek: input.dayOfWeek,
          timeOfDay: input.timeOfDay,
        },
      },
      update: {
        timezone: input.timezone,
        status: input.status,
      },
      create: {
        workspaceId: workspace.id,
        platform: input.platform,
        dayOfWeek: input.dayOfWeek,
        timeOfDay: input.timeOfDay,
        timezone: input.timezone,
        status: input.status,
      },
    }).catch(() => upsertQueueSlot(input))
    return json({ slot }, { status: 201 })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorJson(error, 401)
    }
    if (isDatabaseConfigured()) {
      return errorJson(error)
    }
    const input = queueSlotSchema.parse(payload)
    const slot = upsertQueueSlot(input)
    return json({ slot }, { status: 201 })
  }
}
