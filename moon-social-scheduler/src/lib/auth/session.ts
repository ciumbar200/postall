import { WorkspaceRole } from "@/lib/domain/enums"
import { prisma } from "@/lib/db/client"
import { optionalEnv } from "@/lib/env"
import { getSupabaseUser } from "@/lib/supabase/server"
import { hasSupabaseAuthEnv } from "@/lib/supabase/env"
import { isDatabaseConfigured } from "@/lib/db/runtime"
import { withTimeout } from "@/lib/async/with-timeout"

const DB_TIMEOUT_MS = 8000

type SessionIdentity = {
  email: string
  name: string
  image?: string | null
}

function slugFromEmail(email: string) {
  const base = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "workspace"
  return `${base}-${Math.random().toString(36).slice(2, 7)}`
}

async function resolveIdentity(): Promise<SessionIdentity> {
  if (hasSupabaseAuthEnv()) {
    const user = await getSupabaseUser()

    if (user?.email) {
      const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
      return {
        email: user.email,
        name:
          (typeof metadata.name === "string" && metadata.name) ||
          (typeof metadata.full_name === "string" && metadata.full_name) ||
          user.email.split("@")[0],
        image: typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
      }
    }
  }

  return {
    email: optionalEnv("DEV_USER_EMAIL", "owner@moon.local"),
    name: optionalEnv("DEV_USER_NAME", "Postall Owner"),
    image: null,
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

type UserContextCore = {
  user: { id: string; email: string; name: string; image: string | null; emailVerified: Date | null; createdAt: Date; updatedAt: Date }
  workspace: { id: string; name: string; slug: string; createdAt: Date; updatedAt: Date }
  role: WorkspaceRole
}

export type UserContext = UserContextCore & {
  userId: string
  workspaceId: string
}

function withContextIds(ctx: UserContextCore): UserContext {
  return {
    ...ctx,
    userId: ctx.user.id,
    workspaceId: ctx.workspace.id,
  }
}

export async function getOptionalUserContext() {
  if (hasSupabaseAuthEnv()) {
    const user = await getSupabaseUser()
    if (!user?.email) {
      return null
    }
  }

  return getCurrentUserContext()
}

/**
 * Returns the authenticated user context. When Supabase Auth is configured and
 * there is no signed-in user, throws UnauthorizedError instead of falling back
 * to the dev identity (prevents leaking the dev workspace in production).
 */
export async function requireUserContext() {
  if (hasSupabaseAuthEnv()) {
    const user = await getSupabaseUser()
    if (!user?.email) {
      throw new UnauthorizedError()
    }
  }

  return getCurrentUserContext()
}

export async function getCurrentUserContext(): Promise<UserContext> {
  if (process.env.DEV_SKIP_DATABASE === "1" || !isDatabaseConfigured()) {
    const identity = await resolveIdentity()
    return withContextIds({
      user: {
        id: "dev-local",
        email: identity.email,
        name: identity.name,
        image: identity.image ?? null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      workspace: {
        id: "dev-local",
        name: optionalEnv("DEV_WORKSPACE_NAME", "Postall Workspace"),
        slug: optionalEnv("DEV_WORKSPACE_SLUG", "dev-local"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      role: WorkspaceRole.OWNER,
    })
  }

  const identity = await resolveIdentity()

  const user = await withTimeout(
    prisma.user.upsert({
    where: { email: identity.email },
    update: {
      name: identity.name,
      image: identity.image ?? undefined,
    },
    create: {
      email: identity.email,
      name: identity.name,
      image: identity.image ?? undefined,
    },
  }),
    DB_TIMEOUT_MS,
    "database"
  )

  const existingMembership = await withTimeout(
    prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  }),
    DB_TIMEOUT_MS,
    "database"
  )

  if (existingMembership) {
    return withContextIds({ user, workspace: existingMembership.workspace, role: existingMembership.role })
  }

  const devSlug = optionalEnv("DEV_WORKSPACE_SLUG", "")
  if (devSlug) {
    const devWorkspace = await prisma.workspace.findUnique({ where: { slug: devSlug } })
    if (devWorkspace) {
      const membership = await prisma.workspaceMember.upsert({
        where: { userId_workspaceId: { userId: user.id, workspaceId: devWorkspace.id } },
        update: {},
        create: { userId: user.id, workspaceId: devWorkspace.id, role: WorkspaceRole.OWNER },
      })
      return withContextIds({ user, workspace: devWorkspace, role: membership.role })
    }
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: `${identity.name}'s Workspace`,
      slug: slugFromEmail(identity.email),
      members: {
        create: {
          userId: user.id,
          role: WorkspaceRole.OWNER,
        },
      },
    },
  })

  return withContextIds({ user, workspace, role: WorkspaceRole.OWNER })
}
