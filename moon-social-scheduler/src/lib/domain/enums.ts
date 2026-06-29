export const Platform = {
  INSTAGRAM: "INSTAGRAM",
  TIKTOK: "TIKTOK",
  YOUTUBE: "YOUTUBE",
  LINKEDIN: "LINKEDIN",
  PINTEREST: "PINTEREST",
  X: "X",
  FACEBOOK: "FACEBOOK",
  THREADS: "THREADS",
  BLUESKY: "BLUESKY",
  SNAPCHAT: "SNAPCHAT",
  GOOGLE_BUSINESS_PROFILE: "GOOGLE_BUSINESS_PROFILE",
  REDDIT: "REDDIT",
  TELEGRAM: "TELEGRAM",
} as const

export type Platform = (typeof Platform)[keyof typeof Platform]

export const WorkspaceRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  APPROVER: "APPROVER",
  VIEWER: "VIEWER",
} as const

export type WorkspaceRole = (typeof WorkspaceRole)[keyof typeof WorkspaceRole]

export const AccountStatus = {
  CONNECTED: "CONNECTED",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
  ERROR: "ERROR",
} as const

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus]

export const MediaType = {
  IMAGE: "IMAGE",
  GIF: "GIF",
  VIDEO: "VIDEO",
} as const

export type MediaType = (typeof MediaType)[keyof typeof MediaType]

export const PostStatus = {
  DRAFT: "DRAFT",
  SCHEDULED: "SCHEDULED",
  QUEUED: "QUEUED",
  PUBLISHING: "PUBLISHING",
  PUBLISHED: "PUBLISHED",
  PARTIALLY_PUBLISHED: "PARTIALLY_PUBLISHED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const

export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus]

export const PublishTargetStatus = {
  DRAFT: "DRAFT",
  SCHEDULED: "SCHEDULED",
  QUEUED: "QUEUED",
  PUBLISHING: "PUBLISHING",
  PUBLISHED: "PUBLISHED",
  FAILED: "FAILED",
  SKIPPED: "SKIPPED",
} as const

export type PublishTargetStatus =
  (typeof PublishTargetStatus)[keyof typeof PublishTargetStatus]

export const PublishJobStatus = {
  WAITING: "WAITING",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  RETRYING: "RETRYING",
  CANCELLED: "CANCELLED",
} as const

export type PublishJobStatus =
  (typeof PublishJobStatus)[keyof typeof PublishJobStatus]

export const QueueSlotStatus = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
} as const

export type QueueSlotStatus =
  (typeof QueueSlotStatus)[keyof typeof QueueSlotStatus]

export const PlanTier = {
  FREE: "FREE",
  CREATOR: "CREATOR",
  AGENT: "AGENT",
  AGENCY: "AGENCY",
} as const

export type PlanTier = (typeof PlanTier)[keyof typeof PlanTier]

export const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  TRIALING: "TRIALING",
  PAST_DUE: "PAST_DUE",
  CANCELED: "CANCELED",
  INCOMPLETE: "INCOMPLETE",
} as const

export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]

export const NotificationType = {
  PUBLISH_FAILED: "PUBLISH_FAILED",
  TOKEN_EXPIRING: "TOKEN_EXPIRING",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  RENEWAL_REMINDER: "RENEWAL_REMINDER",
  SYSTEM: "SYSTEM",
} as const

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType]

export const NotificationSeverity = {
  INFO: "INFO",
  WARNING: "WARNING",
  ERROR: "ERROR",
} as const

export type NotificationSeverity =
  (typeof NotificationSeverity)[keyof typeof NotificationSeverity]
