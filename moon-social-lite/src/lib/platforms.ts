export type Platform =
  | "instagram"
  | "tiktok"
  | "linkedin"
  | "facebook"
  | "youtube"
  | "pinterest"
  | "x"
  | "threads"
  | "bluesky"
  | "telegram"

export type PlatformProviderConfig = {
  key: Platform
  label: string
  accent: string
  envPublicKey?: string
  envSecretKey?: string
  envRedirectKey?: string
  category: "oauth" | "token" | "api"
}

export const supportedPlatforms: PlatformProviderConfig[] = [
  {
    key: "instagram",
    label: "Instagram",
    accent: "#f14f88",
    envPublicKey: "VITE_INSTAGRAM_APP_ID",
    envSecretKey: "INSTAGRAM_APP_SECRET",
    envRedirectKey: "VITE_INSTAGRAM_REDIRECT_URL",
    category: "oauth",
  },
  {
    key: "tiktok",
    label: "TikTok",
    accent: "#30d2e0",
    envPublicKey: "VITE_TIKTOK_CLIENT_KEY",
    envSecretKey: "TIKTOK_CLIENT_SECRET",
    envRedirectKey: "VITE_TIKTOK_REDIRECT_URL",
    category: "oauth",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    accent: "#0a66c2",
    envPublicKey: "VITE_LINKEDIN_CLIENT_ID",
    envSecretKey: "LINKEDIN_CLIENT_SECRET",
    envRedirectKey: "VITE_LINKEDIN_REDIRECT_URL",
    category: "oauth",
  },
  {
    key: "facebook",
    label: "Facebook",
    accent: "#1877f2",
    envPublicKey: "VITE_FACEBOOK_APP_ID",
    envSecretKey: "FACEBOOK_APP_SECRET",
    envRedirectKey: "VITE_FACEBOOK_REDIRECT_URL",
    category: "oauth",
  },
  {
    key: "youtube",
    label: "YouTube",
    accent: "#ff3333",
    envPublicKey: "VITE_YOUTUBE_CLIENT_ID",
    envSecretKey: "YOUTUBE_CLIENT_SECRET",
    envRedirectKey: "VITE_YOUTUBE_REDIRECT_URL",
    category: "oauth",
  },
  {
    key: "pinterest",
    label: "Pinterest",
    accent: "#e60023",
    envPublicKey: "VITE_PINTEREST_APP_ID",
    envSecretKey: "PINTEREST_APP_SECRET",
    envRedirectKey: "VITE_PINTEREST_REDIRECT_URL",
    category: "oauth",
  },
  {
    key: "x",
    label: "X",
    accent: "#d8d8dc",
    envPublicKey: "VITE_X_CLIENT_ID",
    envSecretKey: "X_CLIENT_SECRET",
    envRedirectKey: "VITE_X_REDIRECT_URL",
    category: "oauth",
  },
  {
    key: "threads",
    label: "Threads",
    accent: "#fafafa",
    envPublicKey: "VITE_THREADS_APP_ID",
    envSecretKey: "THREADS_APP_SECRET",
    envRedirectKey: "VITE_THREADS_REDIRECT_URL",
    category: "oauth",
  },
  {
    key: "bluesky",
    label: "Bluesky",
    accent: "#2f9bff",
    envPublicKey: "VITE_BLUESKY_IDENTIFIER",
    envSecretKey: "BLUESKY_APP_PASSWORD",
    category: "token",
  },
  {
    key: "telegram",
    label: "Telegram",
    accent: "#2aa7df",
    envPublicKey: "VITE_TELEGRAM_BOT_NAME",
    envSecretKey: "TELEGRAM_BOT_TOKEN",
    category: "token",
  },
]

export function platformLabel(platform: Platform) {
  return supportedPlatforms.find((item) => item.key === platform)?.label ?? platform
}

export function platformAccent(platform: Platform) {
  return supportedPlatforms.find((item) => item.key === platform)?.accent ?? "#ec5ca7"
}
