import { Platform } from "@/lib/domain/enums"

export const platformMeta = {
  [Platform.INSTAGRAM]: {
    name: "Instagram",
    slug: "instagram",
    color: "#e4405f",
    limit: 2200,
  },
  [Platform.TIKTOK]: {
    name: "TikTok",
    slug: "tiktok",
    color: "#00f2ea",
    limit: 2200,
  },
  [Platform.YOUTUBE]: {
    name: "YouTube",
    slug: "youtube",
    color: "#ff0033",
    limit: 5000,
  },
  [Platform.LINKEDIN]: {
    name: "LinkedIn",
    slug: "linkedin",
    color: "#0a66c2",
    limit: 3000,
  },
  [Platform.PINTEREST]: {
    name: "Pinterest",
    slug: "pinterest",
    color: "#bd081c",
    limit: 500,
  },
  [Platform.X]: {
    name: "X",
    slug: "x",
    color: "#f5f5f5",
    limit: 280,
  },
  [Platform.FACEBOOK]: {
    name: "Facebook",
    slug: "facebook",
    color: "#1877f2",
    limit: 63206,
  },
  [Platform.THREADS]: {
    name: "Threads",
    slug: "threads",
    color: "#f5f5f5",
    limit: 500,
  },
  [Platform.BLUESKY]: {
    name: "Bluesky",
    slug: "bluesky",
    color: "#1185fe",
    limit: 300,
  },
  [Platform.SNAPCHAT]: {
    name: "Snapchat",
    slug: "snapchat",
    color: "#fffc00",
    limit: 250,
  },
  [Platform.GOOGLE_BUSINESS_PROFILE]: {
    name: "Google Business",
    slug: "google-business-profile",
    color: "#34a853",
    limit: 1500,
  },
  [Platform.REDDIT]: {
    name: "Reddit",
    slug: "reddit",
    color: "#ff4500",
    limit: 40000,
  },
  [Platform.TELEGRAM]: {
    name: "Telegram",
    slug: "telegram",
    color: "#24a1de",
    limit: 4096,
  },
} as const

export const mvpPlatforms = [
  Platform.INSTAGRAM,
  Platform.TIKTOK,
  Platform.LINKEDIN,
  Platform.FACEBOOK,
  Platform.YOUTUBE,
] as const
