import { WorkspaceRole } from "@/generated/prisma/enums"
import { prisma } from "@/lib/db/client"
import { optionalEnv } from "@/lib/env"

export async function getCurrentUserContext() {
  const email = optionalEnv("DEV_USER_EMAIL", "owner@moon.local")
  const workspaceSlug = optionalEnv("DEV_WORKSPACE_SLUG", "moon")

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: optionalEnv("DEV_USER_NAME", "MoOn Owner"),
    },
  })

  const workspace = await prisma.workspace.upsert({
    where: { slug: workspaceSlug },
    update: {},
    create: {
      slug: workspaceSlug,
      name: optionalEnv("DEV_WORKSPACE_NAME", "MoOn Workspace"),
      members: {
        create: {
          userId: user.id,
          role: WorkspaceRole.OWNER,
        },
      },
    },
  })

  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: WorkspaceRole.OWNER,
    },
  })

  return { user, workspace }
}
