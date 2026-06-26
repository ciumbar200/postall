import { randomUUID } from "node:crypto"
import {
  Platform,
  PostStatus,
  PublishJobStatus,
  QueueSlotStatus,
} from "@/generated/prisma/enums"
import {
  demoAccounts,
  demoMedia,
  demoPosts,
} from "@/lib/ui/demo-data"

type DemoAccount = (typeof demoAccounts)[number] & {
  disconnectedAt?: string | null
}

type DemoMedia = (typeof demoMedia)[number]

type DemoPost = (typeof demoPosts)[number] & {
  timezone?: string
  media?: DemoMedia[]
}

type DemoQueueSlot = {
  id: string
  platform: Platform
  dayOfWeek: number
  timeOfDay: string
  timezone: string
  status: QueueSlotStatus
}

const globalStore = globalThis as typeof globalThis & {
  __moonLocalStore?: {
    accounts: DemoAccount[]
    media: DemoMedia[]
    posts: DemoPost[]
    slots: DemoQueueSlot[]
  }
}

function createStore() {
  return {
    accounts: structuredClone(demoAccounts) as DemoAccount[],
    media: structuredClone(demoMedia) as DemoMedia[],
    posts: structuredClone(demoPosts) as DemoPost[],
    slots: [] as DemoQueueSlot[],
  }
}

function getStore() {
  if (!globalStore.__moonLocalStore) {
    globalStore.__moonLocalStore = createStore()
  }

  return globalStore.__moonLocalStore
}

export function listAccounts() {
  return getStore().accounts
}

export function connectPlatform(platform: Platform) {
  const store = getStore()
  const existing = store.accounts.find((account) => account.platform === platform)

  if (existing) {
    existing.status = "CONNECTED"
    existing.disconnectedAt = null
    return existing
  }

  // Solo Instagram y TikTok en demo
  if (platform !== Platform.INSTAGRAM && platform !== Platform.TIKTOK) {
    throw new Error(`Platform ${platform} not supported in demo mode`)
  }

  const username =
    platform === Platform.INSTAGRAM ? "moon.instagram.local" : "moon.tiktok.local"
  const account = {
    id: `demo-${platform.toLowerCase()}-${randomUUID()}`,
    platform,
    username,
    displayName: platform === Platform.INSTAGRAM ? "Demo Instagram" : "Demo TikTok",
    status: "CONNECTED",
    avatarUrl: null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    disconnectedAt: null,
  } satisfies DemoAccount

  store.accounts.push(account)
  return account
}

export function revokeAccount(id: string) {
  const account = getStore().accounts.find((item) => item.id === id)

  if (account) {
    account.status = "REVOKED"
    account.disconnectedAt = new Date().toISOString()
  }

  return account
}

export function listMedia() {
  return getStore().media
}

export function addMedia(input: {
  fileName: string
  mimeType: string
  byteSize: string
  publicUrl: string
  type: "IMAGE" | "VIDEO" | "GIF"
}) {
  const asset = {
    id: `media-${randomUUID()}`,
    createdAt: new Date().toISOString(),
    ...input,
  } satisfies DemoMedia

  getStore().media.unshift(asset)
  return asset
}

export function listPosts() {
  return getStore().posts
}

export function createPost(input: {
  baseText: string
  scheduledAt?: string | null
  timezone?: string
  targetAccountIds: string[]
  mediaAssetIds: string[]
}) {
  const store = getStore()
  const accounts = store.accounts.filter((account) =>
    input.targetAccountIds.includes(account.id)
  )
  const media = store.media.filter((asset) => input.mediaAssetIds.includes(asset.id))
  const scheduledAt = input.scheduledAt ?? new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const status = PostStatus.SCHEDULED
  const post = {
    id: `post-${randomUUID()}`,
    baseText: input.baseText,
    status,
    scheduledAt,
    timezone: input.timezone ?? "UTC",
    media,
    targets: accounts.map((account) => ({
      platform: account.platform,
      status: "SCHEDULED",
      socialAccount: account,
    })),
  } satisfies DemoPost

  store.posts.unshift(post)
  return post
}

export function updatePost(id: string, input: { baseText?: string; scheduledAt?: string | null }) {
  const post = getStore().posts.find((item) => item.id === id)

  if (!post) {
    return null
  }

  if (input.baseText !== undefined) {
    post.baseText = input.baseText
  }

  if (input.scheduledAt !== undefined) {
    post.scheduledAt = input.scheduledAt ?? new Date().toISOString()
    post.status = input.scheduledAt ? PostStatus.SCHEDULED : PostStatus.DRAFT
    post.targets = post.targets.map((target) => ({
      ...target,
      status: input.scheduledAt ? "SCHEDULED" : "DRAFT",
    }))
  }

  return post
}

export function publishPost(id: string) {
  const post = getStore().posts.find((item) => item.id === id)

  if (!post) {
    return null
  }

  post.status = PostStatus.PUBLISHED
  post.scheduledAt = new Date().toISOString()
  post.targets = post.targets.map((target) => ({
    ...target,
    status: "PUBLISHED",
  }))

  return {
    id: `job-${randomUUID()}`,
    status: PublishJobStatus.COMPLETED,
    runAt: post.scheduledAt,
    post,
  }
}

export function listQueue() {
  const jobs = getStore()
    .posts.filter((post) => post.status === PostStatus.SCHEDULED || post.status === PostStatus.QUEUED)
    .map((post) => ({
      id: `job-${post.id}`,
      status: PublishJobStatus.WAITING,
      runAt: post.scheduledAt,
      post,
    }))

  return {
    jobs,
    slots: getStore().slots,
  }
}

export function upsertQueueSlot(input: Omit<DemoQueueSlot, "id">) {
  const store = getStore()
  const existing = store.slots.find(
    (slot) =>
      slot.platform === input.platform &&
      slot.dayOfWeek === input.dayOfWeek &&
      slot.timeOfDay === input.timeOfDay
  )

  if (existing) {
    Object.assign(existing, input)
    return existing
  }

  const slot = {
    id: `slot-${randomUUID()}`,
    ...input,
  }

  store.slots.push(slot)
  return slot
}

export function getAnalyticsSnapshot() {
  const posts = getStore().posts

  return {
    metrics: [
      { platform: Platform.INSTAGRAM, metric: "reach", _sum: { value: 18420 } },
      { platform: Platform.INSTAGRAM, metric: "engagement", _sum: { value: 1320 } },
      { platform: Platform.TIKTOK, metric: "views", _sum: { value: 28410 } },
      { platform: Platform.TIKTOK, metric: "clicks", _sum: { value: 640 } },
    ],
    recentTargets: posts.slice(0, 10).flatMap((post) =>
      post.targets.map((target) => ({
        id: `${post.id}-${target.platform}`,
        platform: target.platform,
        status: target.status,
        updatedAt: post.scheduledAt,
        socialAccount: target.socialAccount,
        post,
      }))
    ),
  }
}
