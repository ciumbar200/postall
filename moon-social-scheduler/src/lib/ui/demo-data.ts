import { Platform, PostStatus, PublishJobStatus } from "@/generated/prisma/enums"

export const demoAccounts = [
  {
    id: "demo-instagram",
    platform: Platform.INSTAGRAM,
    username: "moon.studio",
    displayName: "MoOn Studio",
    status: "CONNECTED",
    avatarUrl: null,
    expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-tiktok",
    platform: Platform.TIKTOK,
    username: "moon.scheduler",
    displayName: "MoOn Scheduler",
    status: "CONNECTED",
    avatarUrl: null,
    expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const demoPosts = [
  {
    id: "post-1",
    baseText: "Launch thread for the new visual calendar.",
    status: PostStatus.SCHEDULED,
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    targets: [
      { platform: Platform.INSTAGRAM, status: "SCHEDULED", socialAccount: demoAccounts[0] },
      { platform: Platform.TIKTOK, status: "SCHEDULED", socialAccount: demoAccounts[1] },
    ],
  },
  {
    id: "post-2",
    baseText: "Behind the scenes clip with direct API publishing.",
    status: PostStatus.QUEUED,
    scheduledAt: new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString(),
    targets: [{ platform: Platform.TIKTOK, status: "QUEUED", socialAccount: demoAccounts[1] }],
  },
  {
    id: "post-3",
    baseText: "Carousel recap and CTA.",
    status: PostStatus.PUBLISHED,
    scheduledAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    targets: [{ platform: Platform.INSTAGRAM, status: "PUBLISHED", socialAccount: demoAccounts[0] }],
  },
]

export const demoQueueJobs = [
  {
    id: "job-1",
    status: PublishJobStatus.WAITING,
    runAt: demoPosts[0].scheduledAt,
    post: demoPosts[0],
  },
  {
    id: "job-2",
    status: PublishJobStatus.WAITING,
    runAt: demoPosts[1].scheduledAt,
    post: demoPosts[1],
  },
]

export const demoMedia = [
  {
    id: "media-1",
    type: "IMAGE",
    fileName: "launch-visual.png",
    mimeType: "image/png",
    byteSize: "824531",
    publicUrl: "/window.svg",
    createdAt: new Date().toISOString(),
  },
  {
    id: "media-2",
    type: "VIDEO",
    fileName: "behind-scenes.mp4",
    mimeType: "video/mp4",
    byteSize: "10349211",
    publicUrl: "/file.svg",
    createdAt: new Date().toISOString(),
  },
]
