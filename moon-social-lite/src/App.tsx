import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  BarChart3,
  Briefcase,
  CalendarDays,
  CheckCheck,
  Clock3,
  CopyPlus,
  CreditCard,
  FolderCog,
  GalleryVerticalEnd,
  Globe2,
  Image,
  KeyRound,
  LayoutDashboard,
  Link2,
  ListTodo,
  Radio,
  Rocket,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react"
import { addDays, format, startOfDay } from "date-fns"
import { clsx } from "clsx"
import { hasSupabaseEnv, supabase } from "./lib/supabase"
import {
  platformAccent,
  platformLabel,
  supportedPlatforms,
  type Platform,
} from "./lib/platforms"
import { usePersistentState } from "./lib/use-persistent-state"
import heroImage from "./assets/hero.png"
import "./App.css"

type NavKey =
  | "landing"
  | "demo"
  | "board"
  | "overview"
  | "compose"
  | "calendar"
  | "accounts"
  | "queue"
  | "analytics"
  | "media"
  | "templates"
  | "integrations"
  | "workspaces"
  | "billing"
  | "settings"

type ConnectedAccount = {
  id: string
  platform: Platform
  handle: string
  name: string
  mode: "demo" | "live"
  status: "connected" | "expired"
}

type ScheduledPost = {
  id: string
  copy: string
  scheduledAt: string
  platforms: Platform[]
  status: "draft" | "scheduled" | "published"
}

type ProviderConfig = {
  supabaseUrl: string
  supabasePublishableKey: string
  providers: Record<
    Platform,
    {
      publicValue: string
      secretValue: string
      redirectValue?: string
    }
  >
}

type WorkspaceProfile = {
  name: string
  owner: string
  plan: string
  timezone: string
}

type PlatformPlaybook = {
  limit: string
  output: string
  setting: string
}

type AnalyticsRow = {
  platform: Platform
  reach: string
  engagement: string
  clicks: string
  score: number
  note: string
}

type MediaAsset = {
  id: string
  name: string
  type: "image" | "video"
  size: string
  ratio: string
  platforms: Platform[]
  tone: "launch" | "editorial" | "motion"
}

type TemplateCard = {
  id: string
  title: string
  summary: string
  channels: Platform[]
  variables: string[]
}

type ProviderReadinessRow = {
  platform: Platform
  account?: ConnectedAccount
  hasConfig: boolean
  callback: string
  category: string
}

type ActivityEntry = {
  id: string
  at: string
  category: "config" | "account" | "content" | "billing"
  title: string
  detail: string
  platform?: Platform
}

type TeamMember = {
  id: string
  name: string
  role: string
  focus: string
  status: "active" | "review" | "pending"
}

type WorkspaceLane = {
  id: string
  title: string
  summary: string
  members: string[]
  networks: Platform[]
}

type RoiSignal = {
  id: string
  title: string
  metric: string
  detail: string
}

type BuyerSegment = {
  id: string
  title: string
  team: string
  pain: string
  value: string
}

type InvestorLens = {
  id: string
  label: string
  headline: string
  detail: string
}

type AppSnapshot = {
  workspace: WorkspaceProfile
  accounts: ConnectedAccount[]
  posts: ScheduledPost[]
  config: ProviderConfig
  copy: string
  scheduledAt: string
  selectedPlatforms: Platform[]
  selectedAssetIds: string[]
  activity: ActivityEntry[]
}

type ProviderScopeMap = Record<Platform, string[]>

type LaunchPlatform = "instagram" | "tiktok" | "linkedin" | "facebook" | "youtube"

const navItems = [
  { key: "demo", label: "Demo Flow", icon: Sparkles },
  { key: "board", label: "Investor Board", icon: Radio },
  { key: "overview", label: "Overview", icon: Rocket },
  { key: "compose", label: "Compose", icon: LayoutDashboard },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "accounts", label: "Accounts", icon: Link2 },
  { key: "queue", label: "Queue", icon: ListTodo },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "media", label: "Media", icon: Image },
  { key: "templates", label: "Templates", icon: CopyPlus },
  { key: "integrations", label: "Integrations", icon: Link2 },
  { key: "workspaces", label: "Workspaces", icon: Briefcase },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "settings", label: "Settings", icon: Settings2 },
] satisfies Array<{ key: NavKey; label: string; icon: typeof LayoutDashboard }>

const pageTitles: Record<NavKey, string> = {
  landing: "MoOn - Direct social publishing",
  demo: "MoOn - Demo Flow",
  board: "MoOn - Investor Board",
  overview: "MoOn - Overview",
  compose: "MoOn - Compose",
  calendar: "MoOn - Calendar",
  accounts: "MoOn - Accounts",
  queue: "MoOn - Queue",
  analytics: "MoOn - Analytics",
  media: "MoOn - Media",
  templates: "MoOn - Templates",
  integrations: "MoOn - Integrations",
  workspaces: "MoOn - Workspaces",
  billing: "MoOn - Billing",
  settings: "MoOn - Settings",
}

const validNavKeys = new Set<NavKey>(["landing", ...navItems.map((item) => item.key)])

const launchPlatforms = ["instagram", "tiktok", "linkedin", "facebook", "youtube"] as const satisfies LaunchPlatform[]

function buildSampleAccount(platform: Platform, index = 1): ConnectedAccount {
  const variants: Record<Platform, Pick<ConnectedAccount, "handle" | "name">> = {
    instagram: {
      handle: "@brandstudio.co",
      name: "Instagram sample business account",
    },
    tiktok: {
      handle: "@brandstudio.video",
      name: "TikTok sample creator account",
    },
    linkedin: {
      handle: "MoOn Studio",
      name: "LinkedIn sample company page",
    },
    facebook: {
      handle: "MoOn Studio",
      name: "Facebook sample page",
    },
    youtube: {
      handle: "@moonstudio",
      name: "YouTube sample channel",
    },
    pinterest: {
      handle: "MoOn Visuals",
      name: `Pinterest sample board ${index}`,
    },
    x: {
      handle: "@moonstudiohq",
      name: `X sample account ${index}`,
    },
    threads: {
      handle: "@moonstudio",
      name: `Threads sample account ${index}`,
    },
    bluesky: {
      handle: "moonstudio.bsky.social",
      name: `Bluesky sample account ${index}`,
    },
    telegram: {
      handle: "@moon_scheduler_bot",
      name: `Telegram sample bot ${index}`,
    },
  }

  return {
    id: `${platform}-sample-${index}`,
    platform,
    handle: variants[platform].handle,
    name: variants[platform].name,
    mode: "demo",
    status: "expired",
  }
}

function getNavFromHash(): NavKey {
  if (typeof window === "undefined") {
    return "landing"
  }

  const hash = window.location.hash.replace("#/", "").split("?")[0]
  return validNavKeys.has(hash as NavKey) ? (hash as NavKey) : "landing"
}

function getConnectFromHash(): Platform | null {
  if (typeof window === "undefined") {
    return null
  }

  const hash = window.location.hash.replace("#/", "")
  const query = hash.split("?")[1]
  if (!query) {
    return null
  }

  const params = new URLSearchParams(query)
  const connect = params.get("connect")
  return supportedPlatforms.some((item) => item.key === connect) ? (connect as Platform) : null
}

const initialAccounts: ConnectedAccount[] = launchPlatforms.map((platform) => buildSampleAccount(platform))

const initialPosts: ScheduledPost[] = [
  {
    id: "post-1",
    copy: "Product update with a clean preview and direct publishing flow.",
    scheduledAt: addDays(startOfDay(new Date()), 1).toISOString(),
    platforms: ["instagram", "tiktok", "linkedin"],
    status: "scheduled",
  },
  {
    id: "post-2",
    copy: "Short teaser with CTA to the full launch page and a YouTube short variant.",
    scheduledAt: addDays(startOfDay(new Date()), 2).toISOString(),
    platforms: ["youtube", "facebook"],
    status: "draft",
  },
]

const initialConfig: ProviderConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
  providers: Object.fromEntries(
    supportedPlatforms.map((platform) => [
      platform.key,
      {
        publicValue:
          platform.envPublicKey && import.meta.env[platform.envPublicKey]
            ? String(import.meta.env[platform.envPublicKey])
            : "",
        secretValue:
          platform.envSecretKey && import.meta.env[platform.envSecretKey]
            ? String(import.meta.env[platform.envSecretKey])
            : "",
        redirectValue:
          platform.envRedirectKey && import.meta.env[platform.envRedirectKey]
            ? String(import.meta.env[platform.envRedirectKey])
            : getProviderCallback(platform.key),
      },
    ])
  ) as ProviderConfig["providers"],
}

const initialWorkspace: WorkspaceProfile = {
  name: "MoOn Studio",
  owner: "valentin@moon.social",
  plan: "Growth",
  timezone: "Europe/Madrid",
}

const platformPlaybooks: Record<Platform, PlatformPlaybook> = {
  instagram: {
    limit: "2,200 chars",
    output: "Feed post with primary image + caption",
    setting: "First comment hashtags",
  },
  tiktok: {
    limit: "4,000 chars",
    output: "Video post with short CTA caption",
    setting: "Privacy + commercial toggle",
  },
  linkedin: {
    limit: "3,000 chars",
    output: "Company page update with link-safe copy",
    setting: "Authoring identity",
  },
  facebook: {
    limit: "63,206 chars",
    output: "Feed post with image and destination link",
    setting: "Cross-post page selection",
  },
  youtube: {
    limit: "5,000 chars",
    output: "Short or video publish package",
    setting: "Title, privacy, category",
  },
  pinterest: {
    limit: "500 chars",
    output: "Pin description + media destination",
    setting: "Board selection",
  },
  x: {
    limit: "280 chars",
    output: "Short-form post with optional media",
    setting: "Thread continuation",
  },
  threads: {
    limit: "500 chars",
    output: "Thread entry with visual asset",
    setting: "Reply permissions",
  },
  bluesky: {
    limit: "300 chars",
    output: "AT Protocol post with facets",
    setting: "Custom domain identity",
  },
  telegram: {
    limit: "4,096 chars",
    output: "Channel push with captioned media",
    setting: "Bot channel target",
  },
}

const analyticsRows: AnalyticsRow[] = [
  {
    platform: "instagram",
    reach: "18.4K",
    engagement: "5.9%",
    clicks: "428",
    score: 88,
    note: "Carousel launch posts are outperforming short-caption variants.",
  },
  {
    platform: "tiktok",
    reach: "14.2K",
    engagement: "6.3%",
    clicks: "219",
    score: 81,
    note: "Strong view volume, weaker destination traffic than Instagram and LinkedIn.",
  },
  {
    platform: "linkedin",
    reach: "6.9K",
    engagement: "4.2%",
    clicks: "351",
    score: 77,
    note: "Lower reach, stronger click intent from company-page traffic.",
  },
  {
    platform: "facebook",
    reach: "4.1K",
    engagement: "2.8%",
    clicks: "146",
    score: 59,
    note: "Cross-posting is modeled, but real page routing still needs configuration.",
  },
]

const mediaAssets: MediaAsset[] = [
  {
    id: "asset-1",
    name: "Launch still master",
    type: "image",
    size: "3.8 MB",
    ratio: "4:5",
    platforms: ["instagram", "linkedin", "facebook"],
    tone: "launch",
  },
  {
    id: "asset-2",
    name: "Behind-the-scenes edit",
    type: "video",
    size: "142 MB",
    ratio: "9:16",
    platforms: ["tiktok", "youtube", "instagram"],
    tone: "motion",
  },
  {
    id: "asset-3",
    name: "Pinterest vertical export",
    type: "image",
    size: "2.1 MB",
    ratio: "2:3",
    platforms: ["pinterest"],
    tone: "editorial",
  },
  {
    id: "asset-4",
    name: "Channel announcement card",
    type: "image",
    size: "1.4 MB",
    ratio: "16:9",
    platforms: ["telegram", "threads", "x"],
    tone: "launch",
  },
]

const templateCards: TemplateCard[] = [
  {
    id: "template-1",
    title: "Launch campaign",
    summary: "Primary CTA, creator quote, feature line, and network-safe hooks.",
    channels: ["instagram", "tiktok", "linkedin", "facebook"],
    variables: ["{{launch_date}}", "{{offer_url}}", "{{product_name}}"],
  },
  {
    id: "template-2",
    title: "Short-form teaser",
    summary: "Quick hook, one-line CTA, and asset reminder for motion-first networks.",
    channels: ["tiktok", "youtube", "threads", "x"],
    variables: ["{{creator_name}}", "{{drop_time}}", "{{tracking_url}}"],
  },
]

const teamMembers: TeamMember[] = [
  {
    id: "member-1",
    name: "Valentin Ross",
    role: "Founder / operator",
    focus: "Owns calendar, positioning and investor demo flow.",
    status: "active",
  },
  {
    id: "member-2",
    name: "Marta Diaz",
    role: "Content lead",
    focus: "Reviews captions, launch timing and platform-specific copy.",
    status: "review",
  },
  {
    id: "member-3",
    name: "Leo Studio",
    role: "Creative partner",
    focus: "Prepares visuals, video variants and media library hygiene.",
    status: "pending",
  },
]

const workspaceLanes: WorkspaceLane[] = [
  {
    id: "lane-1",
    title: "MoOn Studio",
    summary: "Primary brand workspace with direct social launch priority.",
    members: ["Valentin Ross", "Marta Diaz"],
    networks: ["instagram", "tiktok", "linkedin"],
  },
  {
    id: "lane-2",
    title: "Retail expansion",
    summary: "Secondary workspace for partners, YouTube explainers and Facebook retargeting.",
    members: ["Leo Studio"],
    networks: ["facebook", "youtube", "pinterest"],
  },
]

const roiSignals: RoiSignal[] = [
  {
    id: "roi-1",
    title: "Weekly operator time recovered",
    metric: "11.5 h",
    detail: "One shell for compose, approvals, queue and account state removes handoffs between tools.",
  },
  {
    id: "roi-2",
    title: "Channels managed per operator",
    metric: "5 launch channels",
    detail: "Instagram, TikTok, LinkedIn, Facebook and YouTube can sit inside one workflow without context loss.",
  },
  {
    id: "roi-3",
    title: "Commercial expansion trigger",
    metric: "+2.4x ARPU path",
    detail: "Workspaces, approvals and governance move the sale from creator tooling into teams and agencies.",
  },
]

const buyerSegments: BuyerSegment[] = [
  {
    id: "buyer-1",
    title: "Consumer brand teams",
    team: "2-8 operators",
    pain: "Too many launches, too many channels, no single source of truth.",
    value: "MoOn centralizes publishing, timing, assets and account posture.",
  },
  {
    id: "buyer-2",
    title: "B2B marketing teams",
    team: "Founder + content + demand gen",
    pain: "LinkedIn and YouTube workflows live outside the same planning system.",
    value: "MoOn brings company pages, videos and approvals into one revenue workflow.",
  },
  {
    id: "buyer-3",
    title: "Agencies and multi-brand groups",
    team: "Workspace-based collaboration",
    pain: "Client accounts, approvals and governance break lightweight schedulers.",
    value: "MoOn turns social ops into account infrastructure, not just a calendar.",
  },
]

const investorLens: InvestorLens[] = [
  {
    id: "lens-1",
    label: "Moat",
    headline: "Direct API ownership compounds",
    detail: "Each official provider integration increases product control, pricing power and switching cost.",
  },
  {
    id: "lens-2",
    label: "Expansion",
    headline: "The wedge broadens after launch",
    detail: "Instagram and TikTok open the motion, but LinkedIn, Facebook and YouTube unlock B2B and team budgets.",
  },
  {
    id: "lens-3",
    label: "Retention",
    headline: "Workflow depth defends revenue",
    detail: "Accounts, queue, approvals, templates and analytics make MoOn harder to replace than a simple scheduler.",
  },
]

const initialActivity: ActivityEntry[] = [
  {
    id: "activity-1",
    at: addDays(new Date(), -1).toISOString(),
    category: "content",
    title: "Launch queue seeded",
    detail: "Two launch posts were added for Instagram, TikTok, LinkedIn and Facebook review.",
  },
  {
    id: "activity-2",
    at: addDays(new Date(), -1).toISOString(),
    category: "config",
    title: "Provider matrix exposed",
    detail: "Provider credentials, callbacks and env posture are now visible from Settings.",
  },
  {
    id: "activity-3",
    at: new Date().toISOString(),
    category: "billing",
    title: "Growth plan active",
    detail: "Workspace is positioned on the Growth plan with multi-network scheduling narrative.",
  },
]

const providerScopes: ProviderScopeMap = {
  instagram: ["instagram_basic", "instagram_content_publish", "pages_show_list"],
  tiktok: ["user.info.basic", "video.publish", "video.upload"],
  linkedin: ["w_member_social", "r_organization_social", "rw_organization_admin"],
  facebook: ["pages_manage_posts", "pages_read_engagement", "business_management"],
  youtube: ["youtube.upload", "youtube.readonly", "youtube"],
  pinterest: ["boards:read", "pins:read", "pins:write"],
  x: ["tweet.read", "tweet.write", "users.read"],
  threads: ["threads_basic", "threads_content_publish", "threads_manage_replies"],
  bluesky: ["identifier", "app-password", "repo-write"],
  telegram: ["bot-token", "channel-posting", "media-send"],
}

const providerBuyerCase: Record<
  LaunchPlatform,
  {
    buyer: string
    motion: string
    upside: string
  }
> = {
  instagram: {
    buyer: "Consumer brands and creator-led launches",
    motion: "Visual commerce and announcement cadence",
    upside: "High posting frequency keeps the scheduler sticky",
  },
  tiktok: {
    buyer: "Creator teams and motion-first brands",
    motion: "Short-form publishing with privacy and commercial controls",
    upside: "Video workflows raise operational complexity and retention",
  },
  linkedin: {
    buyer: "B2B founders, SaaS teams and agencies",
    motion: "Company page distribution and executive thought leadership",
    upside: "Moves MoOn into higher-ARPU teams with approval needs",
  },
  facebook: {
    buyer: "Multi-location brands and paid-organic operators",
    motion: "Page publishing and cross-channel campaign support",
    upside: "Brings page governance and partner workflows into scope",
  },
  youtube: {
    buyer: "Education, media and product marketing teams",
    motion: "Video launch packaging across long-form and Shorts",
    upside: "Extends MoOn into higher-value media operations",
  },
}

const demoProviderSeeds: Partial<
  Record<
    Platform,
    {
      publicValue: string
      secretValue: string
      redirectValue?: string
    }
  >
> = {
  instagram: {
    publicValue: "ig-demo-client-id",
    secretValue: "ig-demo-secret",
    redirectValue: "https://app.moon.social/auth/instagram/callback",
  },
  tiktok: {
    publicValue: "tt-demo-client-key",
    secretValue: "tt-demo-secret",
    redirectValue: "https://app.moon.social/auth/tiktok/callback",
  },
  linkedin: {
    publicValue: "li-demo-client-id",
    secretValue: "li-demo-secret",
    redirectValue: "https://app.moon.social/auth/linkedin/callback",
  },
  facebook: {
    publicValue: "fb-demo-app-id",
    secretValue: "fb-demo-secret",
    redirectValue: "https://app.moon.social/auth/facebook/callback",
  },
  youtube: {
    publicValue: "yt-demo-client-id",
    secretValue: "yt-demo-secret",
    redirectValue: "https://app.moon.social/auth/youtube/callback",
  },
}

function getProviderCallback(platform: Platform) {
  return `https://app.moon.social/auth/${platform}/callback`
}

function isLegacyPlaceholder(value: string | undefined, reserved?: string) {
  if (!value) return false
  return value === reserved || value === "https://your-project-ref.supabase.co" || value === "sb_publishable_xxxxxxxxxxxxxxxxx"
}

function getProviderStatus(platform: Platform, provider: ProviderConfig["providers"][Platform]) {
  const definition = supportedPlatforms.find((item) => item.key === platform)
  const publicReady = Boolean(provider.publicValue.trim()) && !isLegacyPlaceholder(provider.publicValue, definition?.envPublicKey)
  const secretReady =
    definition?.category === "oauth"
      ? Boolean(provider.secretValue.trim()) &&
        !isLegacyPlaceholder(provider.secretValue, definition?.envSecretKey)
      : true

  return {
    publicReady,
    secretReady,
    ready: publicReady && secretReady,
  }
}

function getProviderPlaceholders(platform: Platform) {
  const definition = supportedPlatforms.find((item) => item.key === platform)

  return {
    publicValue:
      definition?.category === "oauth"
        ? `Client ID / Key · ${definition?.envPublicKey ?? "env"}`
        : `Public identifier · ${definition?.envPublicKey ?? "env"}`,
    secretValue:
      definition?.category === "oauth"
        ? `Client secret · ${definition?.envSecretKey ?? "secret"}`
        : `Token / app password · ${definition?.envSecretKey ?? "secret"}`,
    redirectValue: getProviderCallback(platform),
  }
}

function getProviderExampleValue(platform: Platform) {
  switch (platform) {
    case "instagram":
      return "1789xxxxxx"
    case "tiktok":
      return "aw12cd34ef56"
    case "linkedin":
      return "86ab12cd34"
    case "facebook":
      return "3847xxxxxx"
    case "youtube":
      return "1234567890-abcdef.apps.googleusercontent.com"
    case "pinterest":
      return "pin-app-123456"
    case "x":
      return "x-client-prod-01"
    case "threads":
      return "thr-app-123456"
    case "bluesky":
      return "brandstudio.bsky.social"
    case "telegram":
      return "moon_scheduler_bot"
  }
}

function getProviderSecretExample(platform: Platform) {
  switch (platform) {
    case "instagram":
    case "facebook":
      return "meta-secret-xxxxxxxx"
    case "tiktok":
      return "tt-secret-xxxxxxxx"
    case "linkedin":
      return "li-secret-xxxxxxxx"
    case "youtube":
      return "gcp-secret-xxxxxxxx"
    case "pinterest":
      return "pin-secret-xxxxxxxx"
    case "x":
      return "x-secret-xxxxxxxx"
    case "threads":
      return "thr-secret-xxxxxxxx"
    case "bluesky":
      return "bsky-app-password"
    case "telegram":
      return "123456:telegram-bot-token"
  }
}

function accountModeLabel(mode: ConnectedAccount["mode"]) {
  return mode === "demo" ? "sample" : "live"
}

function buildPresentationConfig(base: ProviderConfig): ProviderConfig {
  const next = normalizeProviderConfigState(base)

  for (const platform of launchPlatforms) {
    const seed = demoProviderSeeds[platform]
    if (!seed) continue

    next.providers[platform] = {
      ...next.providers[platform],
      publicValue: seed.publicValue,
      secretValue: seed.secretValue,
      redirectValue: seed.redirectValue ?? next.providers[platform].redirectValue,
    }
  }

  return next
}

function normalizeAccountsState(current: ConnectedAccount[]): ConnectedAccount[] {
  const legacyIds = new Set(["demo-instagram", "demo-tiktok", "demo-linkedin"])
  const normalized = current.map((account) => {
    if (!legacyIds.has(account.id)) {
      return account
    }

    return {
      ...account,
      id: account.id.replace("demo-", "sandbox-"),
      ...buildSampleAccount(account.platform),
      mode: "demo",
      status: "expired",
    }
  })

  for (const platform of launchPlatforms) {
    if (!normalized.some((account) => account.platform === platform)) {
      normalized.push(buildSampleAccount(platform))
    }
  }

  return normalized
}

function normalizeProviderConfigState(current: ProviderConfig) {
  return {
    ...current,
    supabaseUrl: isLegacyPlaceholder(current.supabaseUrl) ? "" : current.supabaseUrl,
    supabasePublishableKey: isLegacyPlaceholder(current.supabasePublishableKey)
      ? ""
      : current.supabasePublishableKey,
    providers: Object.fromEntries(
      supportedPlatforms.map((platform) => {
        const provider = current.providers[platform.key]
        return [
          platform.key,
          {
            publicValue: isLegacyPlaceholder(provider.publicValue, platform.envPublicKey)
              ? ""
              : provider.publicValue,
            secretValue: isLegacyPlaceholder(provider.secretValue, platform.envSecretKey)
              ? ""
              : provider.secretValue,
            redirectValue: isLegacyPlaceholder(provider.redirectValue, platform.envRedirectKey)
              ? getProviderCallback(platform.key)
              : provider.redirectValue || getProviderCallback(platform.key),
          },
        ]
      })
    ) as ProviderConfig["providers"],
  }
}

function App() {
  const [activeNav, setActiveNav] = useState<NavKey>(() => getNavFromHash())
  const [workspace, setWorkspace] = usePersistentState<WorkspaceProfile>(
    "moon-lite-workspace",
    initialWorkspace
  )
  const [accounts, setAccounts] = usePersistentState<ConnectedAccount[]>(
    "moon-lite-accounts",
    initialAccounts
  )
  const [posts, setPosts] = usePersistentState<ScheduledPost[]>(
    "moon-lite-posts",
    initialPosts
  )
  const [config, setConfig] = usePersistentState<ProviderConfig>(
    "moon-lite-config",
    initialConfig
  )
  const [copy, setCopy] = usePersistentState(
    "moon-lite-copy",
    "Launch the multi-platform MoOn stack with direct provider setup, explicit credentials, and a cleaner operator experience."
  )
  const [scheduledAt, setScheduledAt] = usePersistentState(
    "moon-lite-scheduled-at",
    addDays(new Date(), 1).toISOString().slice(0, 16)
  )
  const [selectedPlatforms, setSelectedPlatforms] = usePersistentState<Platform[]>(
    "moon-lite-selected-platforms",
    [...launchPlatforms]
  )
  const [showOnboarding, setShowOnboarding] = usePersistentState(
    "moon-lite-show-onboarding",
    false
  )
  const [selectedAssetIds, setSelectedAssetIds] = usePersistentState<string[]>(
    "moon-lite-selected-assets",
    ["asset-1", "asset-2"]
  )
  const [presentationMode, setPresentationMode] = usePersistentState(
    "moon-lite-presentation-mode",
    true
  )
  const [activity, setActivity] = usePersistentState<ActivityEntry[]>(
    "moon-lite-activity",
    initialActivity
  )
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(() =>
    getConnectFromHash()
  )
  const [cloudMode, setCloudMode] = useState<"local" | "loading" | "synced" | "error">(
    hasSupabaseEnv ? "loading" : "local"
  )
  const hasHydratedCloud = useRef(false)

  const scheduledPosts = useMemo(
    () => posts.filter((post) => post.status === "scheduled"),
    [posts]
  )

  const configuredProviders = useMemo(
    () =>
      supportedPlatforms.filter((platform) => {
        const provider = config.providers[platform.key]
        return provider && getProviderStatus(platform.key, provider).ready
      }).length,
    [config.providers]
  )

  const selectedProviderCards = useMemo(
    () => supportedPlatforms.filter((platform) => selectedPlatforms.includes(platform.key)),
    [selectedPlatforms]
  )

  const liveAccounts = useMemo(
    () => accounts.filter((account) => account.mode === "live" && account.status === "connected").length,
    [accounts]
  )

  const connectedAccounts = useMemo(
    () => accounts.filter((account) => account.status === "connected").length,
    [accounts]
  )

  const providerReadinessRows = useMemo<ProviderReadinessRow[]>(
    () =>
      supportedPlatforms.map((platform) => {
        const provider = config.providers[platform.key]
        const account = accounts.find((item) => item.platform === platform.key)

        return {
          platform: platform.key,
          account,
          hasConfig: getProviderStatus(platform.key, provider).ready,
          callback: provider?.redirectValue || getProviderCallback(platform.key),
          category: platform.category,
        }
      }),
    [accounts, config.providers]
  )

  const snapshot = useMemo<AppSnapshot>(
    () => ({
      workspace,
      accounts,
      posts,
      config,
      copy,
      scheduledAt,
      selectedPlatforms,
      selectedAssetIds,
      activity,
    }),
    [
      workspace,
      accounts,
      posts,
      config,
      copy,
      scheduledAt,
      selectedPlatforms,
      selectedAssetIds,
      activity,
    ]
  )

  useEffect(() => {
    const nextHash = connectingPlatform
      ? `#/${activeNav}?connect=${connectingPlatform}`
      : `#/${activeNav}`
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash)
    }
  }, [activeNav, connectingPlatform])

  useEffect(() => {
    function syncFromHash() {
      setActiveNav(getNavFromHash())
      setConnectingPlatform(getConnectFromHash())
    }

    window.addEventListener("hashchange", syncFromHash)
    return () => window.removeEventListener("hashchange", syncFromHash)
  }, [])

  useEffect(() => {
    document.title = pageTitles[activeNav]
  }, [activeNav])

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      const isTypingTarget =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable

      if (isTypingTarget) return

      if (event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault()
        setPresentationMode((current) => !current)
        return
      }

      if (event.shiftKey && event.key.toLowerCase() === "r") {
        event.preventDefault()
        preparePresentationState()
        return
      }

      if (event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault()
        setActiveNav("demo")
      }
    }

    window.addEventListener("keydown", handleKeydown)
    return () => window.removeEventListener("keydown", handleKeydown)
  }, [preparePresentationState, setPresentationMode])

  useEffect(() => {
    setAccounts((current) => normalizeAccountsState(current))
    setConfig((current) => normalizeProviderConfigState(current))
    setShowOnboarding(false)
  }, [setAccounts, setConfig, setShowOnboarding])

  useEffect(() => {
    if (!supabase) {
      hasHydratedCloud.current = true
      setCloudMode("local")
      return
    }

    let cancelled = false

    async function loadCloudSnapshot() {
      const { data, error } = await supabase
        .from("workspace_state")
        .select("payload")
        .eq("workspace_key", "primary")
        .maybeSingle()

      if (cancelled) return

      if (error) {
        setCloudMode("error")
        hasHydratedCloud.current = true
        return
      }

      const payload = data?.payload as Partial<AppSnapshot> | undefined

      if (payload?.workspace) setWorkspace(payload.workspace)
      if (payload?.accounts) setAccounts(normalizeAccountsState(payload.accounts))
      if (payload?.posts) setPosts(payload.posts)
      if (payload?.config) setConfig(normalizeProviderConfigState(payload.config))
      if (payload?.copy) setCopy(payload.copy)
      if (payload?.scheduledAt) setScheduledAt(payload.scheduledAt)
      if (payload?.selectedPlatforms) setSelectedPlatforms(payload.selectedPlatforms)
      if (payload?.selectedAssetIds) setSelectedAssetIds(payload.selectedAssetIds)
      if (payload?.activity) setActivity(payload.activity)

      hasHydratedCloud.current = true
      setCloudMode("synced")
    }

    void loadCloudSnapshot()

    return () => {
      cancelled = true
    }
  }, [
    setWorkspace,
    setAccounts,
    setPosts,
    setConfig,
    setCopy,
    setScheduledAt,
    setSelectedPlatforms,
    setSelectedAssetIds,
    setActivity,
  ])

  useEffect(() => {
    if (!supabase || !hasHydratedCloud.current) return

    setCloudMode("loading")
    const timeout = window.setTimeout(async () => {
      const { error } = await supabase.from("workspace_state").upsert(
        {
          workspace_key: "primary",
          payload: snapshot,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_key" }
      )

      setCloudMode(error ? "error" : "synced")
    }, 900)

    return () => window.clearTimeout(timeout)
  }, [snapshot])

  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform]
    )
  }

  function appendActivity(entry: Omit<ActivityEntry, "id" | "at">) {
    setActivity((current) => [
      {
        id: `activity-${crypto.randomUUID()}`,
        at: new Date().toISOString(),
        ...entry,
      },
      ...current,
    ].slice(0, 12))
  }

  function toggleAccountMode(accountId: string) {
    const target = accounts.find((account) => account.id === accountId)
    if (!target) return

    const nextMode = target.mode === "demo" ? "live" : "demo"
    const nextStatus = target.mode === "demo" ? "connected" : "expired"

    setAccounts((current) =>
      current.map((account) =>
        account.id === accountId
          ? {
              ...account,
              mode: nextMode,
              status: nextStatus,
            }
          : account
      )
    )
    appendActivity({
      category: "account",
      platform: target.platform,
      title: `${platformLabel(target.platform)} account marked ${accountModeLabel(nextMode)}`,
      detail: `${target.name} is now ${accountModeLabel(nextMode)} with ${nextStatus} status.`,
    })
  }

  function toggleAsset(assetId: string) {
    setSelectedAssetIds((current) =>
      current.includes(assetId)
        ? current.filter((id) => id !== assetId)
        : [...current, assetId]
    )
  }

  function addPlaceholderAccount(platform: Platform) {
    const existingCount = accounts.filter((account) => account.platform === platform).length + 1
    setAccounts((current) => [
      {
        ...buildSampleAccount(platform, existingCount),
        id: `${platform}-${crypto.randomUUID()}`,
      },
      ...current,
    ])
    appendActivity({
      category: "account",
      platform,
      title: `${platformLabel(platform)} sample account created`,
      detail: `A sample account shell was added so onboarding stays visible before a real OAuth connection is completed.`,
    })
  }

  function connectProvider(platform: Platform) {
    const provider = config.providers[platform]
    const providerStatus = getProviderStatus(platform, provider)
    if (!providerStatus.ready) {
      setActiveNav("settings")
      setConnectingPlatform(null)
      appendActivity({
        category: "config",
        platform,
        title: `${platformLabel(platform)} connect blocked`,
        detail: "The connect flow was blocked because client credentials are still incomplete.",
      })
      return
    }

    const existing = accounts.find((account) => account.platform === platform)
    if (existing) {
      setAccounts((current) =>
        current.map((account) =>
          account.platform === platform
            ? {
                ...account,
                mode: "live",
                status: "connected",
                handle:
                  account.handle.startsWith("@") || account.handle.includes(".")
                    ? account.handle
                    : `@${platform}.workspace.live`,
              }
            : account
        )
      )
    } else {
      setAccounts((current) => [
        {
          id: `${platform}-live-${crypto.randomUUID()}`,
          platform,
          handle: `@${platform}.workspace.live`,
          name: `${platformLabel(platform)} live account`,
          mode: "live",
          status: "connected",
        },
        ...current,
      ])
    }

    setConnectingPlatform(null)
    appendActivity({
      category: "account",
      platform,
      title: `${platformLabel(platform)} moved to live`,
      detail: "Connection flow completed and the provider is now shown as a live account.",
    })
  }

  function seedProviderConfig(platform: Platform) {
    const seed = demoProviderSeeds[platform]
    if (!seed) return

    setConfig((current) => ({
      ...current,
      providers: {
        ...current.providers,
        [platform]: {
          ...current.providers[platform],
          publicValue: seed.publicValue,
          secretValue: seed.secretValue,
          redirectValue: seed.redirectValue ?? current.providers[platform].redirectValue,
        },
      },
    }))
    appendActivity({
      category: "config",
      platform,
      title: `${platformLabel(platform)} preset loaded`,
      detail: "Demo credentials were seeded so the provider can be presented as connection-ready.",
    })
  }

  function seedLaunchStack() {
    for (const platform of launchPlatforms) {
      seedProviderConfig(platform)
    }
    appendActivity({
      category: "config",
      title: "Launch stack seeded",
      detail: "Instagram, TikTok, LinkedIn, Facebook and YouTube were moved into demo-ready configuration.",
    })
  }

  function saveDraft() {
    setPosts((current) => [
      {
        id: `draft-${crypto.randomUUID()}`,
        copy,
        scheduledAt: new Date(scheduledAt).toISOString(),
        platforms: selectedPlatforms,
        status: "draft",
      },
      ...current,
    ])
    appendActivity({
      category: "content",
      title: "Draft saved",
      detail: `A draft was stored for ${selectedPlatforms.length} selected network(s).`,
    })
  }

  function schedulePost() {
    setPosts((current) => [
      {
        id: `scheduled-${crypto.randomUUID()}`,
        copy,
        scheduledAt: new Date(scheduledAt).toISOString(),
        platforms: selectedPlatforms,
        status: "scheduled",
      },
      ...current,
    ])
    appendActivity({
      category: "content",
      title: "Post scheduled",
      detail: `A scheduled post was added to queue for ${format(new Date(scheduledAt), "dd/MM/yyyy HH:mm")}.`,
    })
    setActiveNav("queue")
  }

  function switchPlan(plan: string) {
    if (workspace.plan === plan) return
    setWorkspace((current) => ({ ...current, plan }))
    appendActivity({
      category: "billing",
      title: `${plan} plan selected`,
      detail: `Workspace pricing posture moved to ${plan} for the investor-facing commercial story.`,
    })
  }

  const resetWorkspaceState = useCallback(() => {
    setWorkspace(initialWorkspace)
    setAccounts(normalizeAccountsState(initialAccounts))
    setPosts(initialPosts)
    setConfig(normalizeProviderConfigState(initialConfig))
    setCopy(
      "Launch the multi-platform MoOn stack with direct provider setup, explicit credentials, and a cleaner operator experience."
    )
    setScheduledAt(addDays(new Date(), 1).toISOString().slice(0, 16))
    setSelectedPlatforms([...launchPlatforms])
    setSelectedAssetIds(["asset-1", "asset-2"])
    setActivity(initialActivity)
    setConnectingPlatform(null)
    setShowOnboarding(false)
    setActiveNav("landing")
  }, [
    setWorkspace,
    setAccounts,
    setPosts,
    setConfig,
    setCopy,
    setScheduledAt,
    setSelectedPlatforms,
    setSelectedAssetIds,
    setActivity,
    setShowOnboarding,
  ])

  const preparePresentationState = useCallback(() => {
    const presentationAccounts: ConnectedAccount[] = [
      {
        id: "presentation-instagram-live",
        platform: "instagram",
        handle: "@moon.studio",
        name: "MoOn Studio",
        mode: "live",
        status: "connected",
      },
      {
        id: "presentation-tiktok-live",
        platform: "tiktok",
        handle: "@moon.scheduler",
        name: "MoOn Scheduler",
        mode: "live",
        status: "connected",
      },
      {
        id: "presentation-linkedin-live",
        platform: "linkedin",
        handle: "MoOn Company Page",
        name: "MoOn LinkedIn",
        mode: "live",
        status: "connected",
      },
      {
        id: "presentation-facebook-live",
        platform: "facebook",
        handle: "MoOn Facebook Page",
        name: "MoOn Facebook",
        mode: "live",
        status: "connected",
      },
      {
        id: "presentation-youtube-live",
        platform: "youtube",
        handle: "@moonstudio",
        name: "MoOn YouTube",
        mode: "live",
        status: "connected",
      },
    ]

    setWorkspace({
      ...initialWorkspace,
      name: "MoOn",
      plan: "Growth",
    })
    setAccounts(presentationAccounts)
    setPosts(initialPosts)
    setConfig(buildPresentationConfig(initialConfig))
    setCopy(
      "New launch is live. Publish direct, tailor by network, and keep one control plane across social operations."
    )
    setScheduledAt(addDays(new Date(), 1).toISOString().slice(0, 16))
    setSelectedPlatforms([...launchPlatforms])
    setSelectedAssetIds(["asset-1", "asset-2"])
    setPresentationMode(true)
    setActivity([
      {
        id: `activity-${crypto.randomUUID()}`,
        at: new Date().toISOString(),
        category: "billing",
        title: "Presentation state prepared",
        detail: "Workspace was reset into the Growth narrative with the launch provider stack and connected showcase accounts preloaded.",
      },
      ...initialActivity,
    ])
    setConnectingPlatform(null)
    setShowOnboarding(false)
    setActiveNav("landing")
  }, [
    setWorkspace,
    setAccounts,
    setPosts,
    setConfig,
    setCopy,
    setScheduledAt,
    setSelectedPlatforms,
    setSelectedAssetIds,
    setPresentationMode,
    setActivity,
    setShowOnboarding,
  ])

  function startPresentationFlow(target: NavKey = "demo") {
    preparePresentationState()
    setActiveNav(target)
  }

  function renderCompose() {
    return (
      <section className="page-grid">
        <div className="stack">
          <div className="panel panel-lg">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Composer</p>
                <h1>Build one post, tailor it per provider, and keep integration risk visible.</h1>
              </div>
            {!presentationMode ? (
              <button className="ghost-button" type="button" onClick={() => setActiveNav("settings")}>
                <FolderCog size={16} />
                Provider setup
              </button>
            ) : null}
            </div>

          <div className="hero-stats">
              <div className="metric-card">
                <span>Supported providers</span>
                <strong>{supportedPlatforms.length}</strong>
              </div>
              <div className="metric-card">
                <span>Configured now</span>
                <strong>{configuredProviders}</strong>
              </div>
              <div className="metric-card">
                <span>Connected accounts</span>
                <strong>{connectedAccounts}</strong>
              </div>
            </div>

            {!presentationMode ? (
              <div className="banner-row compose-banner-row">
                <div className="banner-card">
                  <Sparkles size={16} />
                  <span>
                    Workspace: {workspace.name} · {workspace.plan} plan · {workspace.timezone}
                  </span>
                </div>
                <div className="banner-card">
                  <Link2 size={16} />
                  <span>
                    Workspace accounts stay visible until real OAuth credentials are loaded in Settings.
                  </span>
                </div>
              </div>
            ) : null}

            <label className="field">
              <span>Post copy</span>
              <textarea value={copy} onChange={(event) => setCopy(event.target.value)} rows={6} />
            </label>

            <div className="grid-two">
              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Attached media</h2>
                    <p>Select reusable assets before pushing the post into queue review.</p>
                  </div>
                  <span className="mode-badge mode-live">{selectedAssetIds.length} attached</span>
                </div>
                <div className="asset-picker">
                  {mediaAssets.slice(0, 3).map((asset) => {
                    const active = selectedAssetIds.includes(asset.id)
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        className={clsx("asset-option", active && "asset-option-active")}
                        onClick={() => toggleAsset(asset.id)}
                      >
                        <div className={clsx("asset-thumb", `media-tone-${asset.tone}`)} />
                        <div className="asset-copy">
                          <strong>{asset.name}</strong>
                          <span>
                            {asset.type} · {asset.size} · {asset.ratio}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Delivery settings</h2>
                    <p>Queue posture and review constraints before real workers exist.</p>
                  </div>
                </div>
                <div className="delivery-stack">
                  <div className="delivery-row">
                    <span>Queue mode</span>
                    <strong>Smart queue</strong>
                  </div>
                  <div className="delivery-row">
                    <span>Timezone</span>
                    <strong>{workspace.timezone}</strong>
                  </div>
                  <div className="delivery-row">
                    <span>Approval</span>
                    <strong>Operator review required</strong>
                  </div>
                  <div className="catalog-flags">
                    <span className="platform-pill">draft-safe</span>
                    <span className="platform-pill">media attached</span>
                    <span className="platform-pill">worker pending</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid-two">
              <div className="field-block">
                <span className="field-title">Publish to</span>
                <div className="chip-row">
                  {supportedPlatforms.map((platform) => (
                    <button
                      key={platform.key}
                      type="button"
                      className={clsx(
                        "select-chip",
                        selectedPlatforms.includes(platform.key) && "select-chip-active"
                      )}
                      onClick={() => togglePlatform(platform.key)}
                    >
                      <span
                        className="dot"
                        style={{ backgroundColor: platformAccent(platform.key) }}
                      />
                      {platform.label}
                    </button>
                  ))}
                </div>
                {!presentationMode ? (
                  <p className="support-text">
                    All ten providers stay available in the composer so the workflow reads like a real multi-network SaaS.
                  </p>
                ) : null}
              </div>

              <label className="field">
                <span>Schedule date</span>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              </label>
            </div>

            <div className="subpanel">
              <div className="subpanel-header">
                <div>
                  <h2>Platform versions</h2>
                  <p>Each selected network shows its own output format, copy limit, and operator setting.</p>
                </div>
                <span className="mode-badge mode-live">{selectedProviderCards.length} active</span>
              </div>
              <div className="version-grid">
                {selectedProviderCards.map((platform) => {
                  const provider = config.providers[platform.key]
                  const configReady = getProviderStatus(platform.key, provider).ready
                  const playbook = platformPlaybooks[platform.key]

                  return (
                    <div key={platform.key} className="version-card">
                      <div className="catalog-top">
                        <div className="catalog-platform">
                          <span className="dot" style={{ backgroundColor: platform.accent }} />
                          <strong>{platform.label}</strong>
                        </div>
                        <span className={clsx("status-badge", configReady ? "status-ok" : "status-risk")}>
                          {configReady ? "credentials loaded" : "setup needed"}
                        </span>
                      </div>
                      <p>{playbook.output}</p>
                      <div className="version-meta">
                        <span className="platform-pill">{playbook.limit}</span>
                        <span className="platform-pill">{playbook.setting}</span>
                      </div>
                      <div className="version-copy">
                        <strong>Preview</strong>
                        <span>{copy}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Connected accounts</h2>
                  <p>Sample accounts appear first. Production OAuth and token credentials live in Settings.</p>
                </div>
                <button className="link-button" type="button" onClick={() => setActiveNav("accounts")}>
                  Review all
                </button>
              </div>
              <div className="account-list">
                {accounts.map((account) => (
                  <div key={account.id} className="account-card">
                    <div>
                      <strong>{account.name}</strong>
                      <span>{account.handle}</span>
                    </div>
                    <div className="account-meta">
                      <span className={clsx("mode-badge", account.mode === "demo" ? "mode-demo" : "mode-live")}>
                        {accountModeLabel(account.mode)}
                      </span>
                      <span
                        className={clsx("status-badge", account.status === "connected" ? "status-ok" : "status-risk")}
                      >
                        {account.status}
                      </span>
                      <button
                        className="inline-button"
                        type="button"
                        onClick={() => toggleAccountMode(account.id)}
                      >
                        Mark as {account.mode === "demo" ? "live" : "sample"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="button-row">
              <button type="button" className="secondary-button" onClick={saveDraft}>
                Save draft
              </button>
              <button type="button" className="primary-button" onClick={schedulePost}>
                <Send size={16} />
                Schedule post
              </button>
            </div>
          </div>
        </div>

        <aside className="stack">
          <div className="panel side-panel">
            <div className="side-header">
              <div>
                <p className="eyebrow">Month view</p>
                <h2>Calendar</h2>
              </div>
              <button type="button" className="link-button" onClick={() => setActiveNav("calendar")}>
                Open
              </button>
            </div>
            <div className="calendar-grid">
              {Array.from({ length: 30 }, (_, index) => {
                const day = index + 1
                const hasPost = scheduledPosts.some(
                  (post) => new Date(post.scheduledAt).getDate() === day
                )
                return (
                  <div key={day} className={clsx("calendar-cell", hasPost && "calendar-cell-active")}>
                    <span>{day}</span>
                    {hasPost ? <span className="calendar-dot" /> : null}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="panel side-panel">
            <div className="side-header">
              <div>
                <p className="eyebrow">Queue</p>
                <h2>Next jobs</h2>
              </div>
              <button type="button" className="link-button" onClick={() => setActiveNav("queue")}>
                Open
              </button>
            </div>
            <div className="queue-list">
              {scheduledPosts.slice(0, 3).map((post) => (
                <div key={post.id} className="queue-item">
                  <div>
                    <strong>{format(new Date(post.scheduledAt), "dd MMM, HH:mm")}</strong>
                    <span>{post.copy}</span>
                  </div>
                  <div className="platform-inline">
                    {post.platforms.map((platform) => (
                      <span key={platform} className="platform-pill">
                        {platformLabel(platform)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel side-panel">
            <div className="side-header">
              <div>
                <p className="eyebrow">Provider config</p>
                <h2>API config snapshot</h2>
              </div>
              <button type="button" className="link-button" onClick={() => setActiveNav("settings")}>
                Settings
              </button>
            </div>
            <div className="env-list">
              <code>VITE_SUPABASE_URL = {config.supabaseUrl}</code>
              <code>VITE_INSTAGRAM_APP_ID = {config.providers.instagram.publicValue}</code>
              <code>VITE_TIKTOK_CLIENT_KEY = {config.providers.tiktok.publicValue}</code>
              <code>VITE_LINKEDIN_CLIENT_ID = {config.providers.linkedin.publicValue}</code>
            </div>
          </div>

          <div className="panel side-panel">
            <div className="side-header">
              <div>
                <p className="eyebrow">Config health</p>
                <h2>What is missing</h2>
              </div>
            </div>
            <ul className="check-list">
              <li>
                <Radio size={16} />
                {hasSupabaseEnv
                  ? "Supabase env is loaded in the client"
                  : "Supabase URL and publishable key still need to be configured"}
              </li>
              <li>
                <Radio size={16} />
                7 more providers still need real credentials for a full launch
              </li>
              <li>
                <Radio size={16} />
                Background publishing is still modeled as app queue, not worker infrastructure
              </li>
            </ul>
          </div>
        </aside>
      </section>
    )
  }

  function renderLanding() {
    return (
      <div className="landing-shell">
        <header className="landing-header">
          <div className="brand">
            <div className="brand-mark">
              <GalleryVerticalEnd size={16} />
            </div>
            <div>
              <strong>MoOn</strong>
              <span>Direct social publishing control plane</span>
            </div>
          </div>
          <div className="landing-actions">
            <button className="ghost-button" type="button" onClick={() => setActiveNav("integrations")}>
              Integrations
            </button>
            <button className="primary-button" type="button" onClick={() => startPresentationFlow("demo")}>
              Start presentation
            </button>
          </div>
        </header>

        <main className="landing-main">
          <section className="landing-hero">
            <div className="landing-copy">
              <p className="eyebrow">Presentation build</p>
              <h1>Build once, publish direct, and scale social operations across Instagram, TikTok, LinkedIn, Facebook, YouTube and the next wave.</h1>
              <p className="landing-lead">
                MoOn is the control plane for social teams that have outgrown fragmented schedulers. Direct provider
                connectivity, one publishing workflow, clear monetization and a credible path into larger brand and
                agency accounts all live in the same product.
              </p>
              <div className="landing-cta-row">
                <button className="primary-button" type="button" onClick={() => startPresentationFlow("demo")}>
                  Start investor mode
                </button>
                <button className="ghost-button" type="button" onClick={() => setActiveNav("demo")}>
                  Demo flow
                </button>
                <button className="secondary-button" type="button" onClick={() => setActiveNav("board")}>
                  Investor board
                </button>
                <button className="secondary-button" type="button" onClick={() => setActiveNav("overview")}>
                  Product overview
                </button>
                <button className="secondary-button" type="button" onClick={() => setActiveNav("billing")}>
                  Pricing model
                </button>
                <button className="secondary-button" type="button" onClick={() => setActiveNav("integrations")}>
                  Provider stack
                </button>
              </div>
            </div>

            <div className="landing-showcase">
              <div className="landing-image-card">
                <img src={heroImage} alt="MoOn product preview" className="landing-image" />
                <div className="landing-image-overlay">
                  <span className="platform-pill">Direct API stack</span>
                  <span className="platform-pill">Investor demo</span>
                </div>
              </div>
              <div className="landing-stat-strip">
                <div className="metric-card">
                  <span>Visible providers</span>
                  <strong>{supportedPlatforms.length}</strong>
                </div>
                <div className="metric-card">
                  <span>Launch providers ready</span>
                  <strong>{connectedAccounts}</strong>
                </div>
                <div className="metric-card">
                  <span>Workspace plans</span>
                  <strong>3</strong>
                </div>
              </div>
              <div className="landing-card-grid">
                <div className="landing-showcase-card">
                  <strong>Presentation state</strong>
                  <p>
                    {presentationMode
                      ? `${connectedAccounts} launch providers ready · ${workspace.plan} plan active`
                      : "Workspace mode active. Switch back to Presenter before the meeting."}
                  </p>
                </div>
                <div className="landing-showcase-card">
                  <strong>Demo flow</strong>
                  <p>A guided presentation path connects positioning, integrations, pricing, workflow and expansion.</p>
                </div>
                <div className="landing-showcase-card">
                  <strong>Overview</strong>
                  <p>Product thesis, roadmap, provider moat and the business case behind the workflow.</p>
                </div>
                <div className="landing-showcase-card">
                  <strong>Integrations</strong>
                  <p>LinkedIn, Facebook and YouTube sit beside Instagram and TikTok on one reusable provider layer.</p>
                </div>
                <div className="landing-showcase-card">
                  <strong>Billing</strong>
                  <p>Starter, Growth and Scale plans convert workflow complexity into recurring revenue and upsell room.</p>
                </div>
                <div className="landing-showcase-card">
                  <strong>Workspaces</strong>
                  <p>Multi-brand lanes, approvals and team roles move the story from tool to system of record.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-band">
            <div className="subpanel">
              <div className="subpanel-header">
                <div>
                  <h2>Commercial signal</h2>
                  <p>Show the room what this software saves, who it is for and why the account expands.</p>
                </div>
              </div>
              <div className="landing-proof-grid">
                <div className="timeline-grid">
                  {roiSignals.map((signal) => (
                    <div key={signal.id} className="timeline-card">
                      <span className="mode-badge mode-live">{signal.metric}</span>
                      <strong>{signal.title}</strong>
                      <p>{signal.detail}</p>
                    </div>
                  ))}
                </div>
                <div className="workspace-grid">
                  {buyerSegments.map((segment) => (
                    <div key={segment.id} className="workspace-card">
                      <strong>{segment.title}</strong>
                      <p>{segment.team}</p>
                      <div className="workspace-foot">
                        <span>{segment.pain}</span>
                      </div>
                      <div className="catalog-flags">
                        <span className="platform-pill">{segment.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="landing-band">
            <div className="thesis-grid">
              <div className="thesis-card">
                <strong>Direct API ownership</strong>
                <p>The integration moat sits inside the product instead of leaking margin to resellers or generic schedulers.</p>
              </div>
              <div className="thesis-card">
                <strong>Operator-first workflow</strong>
                <p>Compose, accounts, queue and analytics stay in one system with explicit readiness states and no hidden setup.</p>
              </div>
              <div className="thesis-card">
                <strong>B2B expansion path</strong>
                <p>LinkedIn, Facebook, YouTube, workspaces and approvals push the product well beyond creator tooling into brand and agency software.</p>
              </div>
            </div>
          </section>

          <section className="landing-band">
            <div className="landing-proof-grid">
              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Why now</h2>
                    <p>The social stack is fragmenting faster than teams can operationalize it.</p>
                  </div>
                </div>
                <ul className="check-list">
                  <li>
                    <CheckCheck size={16} />
                    More networks now matter to one team than a single scheduler was built to handle well.
                  </li>
                  <li>
                    <CheckCheck size={16} />
                    Brand and agency buyers need approvals, governance and account clarity, not just a posting calendar.
                  </li>
                  <li>
                    <CheckCheck size={16} />
                    Direct API ownership becomes more valuable as platforms keep changing their official surfaces.
                  </li>
                </ul>
              </div>

              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Why MoOn</h2>
                    <p>The product combines workflow clarity, integration depth and commercial expansion in one system.</p>
                  </div>
                </div>
                <div className="timeline-grid">
                  <div className="timeline-card">
                    <span className="mode-badge mode-live">Moat</span>
                    <strong>Direct provider layer</strong>
                    <p>Instagram, TikTok, LinkedIn, Facebook and YouTube already sit on one visible product contract.</p>
                  </div>
                  <div className="timeline-card">
                    <span className="mode-badge mode-live">Revenue</span>
                    <strong>Workflow-based pricing</strong>
                    <p>Starter, Growth and Scale map to channel count, collaboration depth and governance needs.</p>
                  </div>
                  <div className="timeline-card">
                    <span className="mode-badge mode-live">Expansion</span>
                    <strong>Workspaces and approvals</strong>
                    <p>The same shell grows naturally from operator workflow into brand and agency software.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-band">
            <div className="subpanel">
              <div className="subpanel-header">
                <div>
                  <h2>Investor FAQ</h2>
                  <p>Answer the obvious questions before they become objections in the room.</p>
                </div>
              </div>
              <div className="thesis-grid">
                <div className="thesis-card">
                  <strong>What is the moat?</strong>
                  <p>Direct provider connectivity, one operator workflow and a reusable multi-network contract across publishing, analytics and approvals.</p>
                </div>
                <div className="thesis-card">
                  <strong>Why does pricing expand?</strong>
                  <p>As teams add channels, approvals, governance and workspaces, the workflow becomes more valuable and more deeply embedded.</p>
                </div>
                <div className="thesis-card">
                  <strong>Why can this become a system of record?</strong>
                  <p>Accounts, content, queue state, media, approvals and performance already belong to one product surface instead of scattered tools.</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    )
  }

  function renderDemo() {
    const demoStops = [
      {
        id: "stop-1",
        step: "01",
        title: "Start with the market pain",
        detail:
          "Open the landing to position MoOn as a direct social publishing control plane, not another lightweight scheduler clone.",
        target: "landing" as NavKey,
        cta: "Open landing",
      },
      {
        id: "stop-2",
        step: "02",
        title: "Show integration depth",
        detail:
          "Move into Integrations and explain why LinkedIn, Facebook and YouTube make the product broader than creator-only tools.",
        target: "integrations" as NavKey,
        cta: "Open integrations",
      },
      {
        id: "stop-3",
        step: "03",
        title: "Explain monetization",
        detail:
          "Go to Billing to show how channels, teams and approvals translate into recurring revenue and expansion paths.",
        target: "billing" as NavKey,
        cta: "Open billing",
      },
      {
        id: "stop-4",
        step: "04",
        title: "Prove the product workflow",
        detail:
          "Use Overview and Compose to show the operator shell, scheduling flow, provider states and queue narrative.",
        target: "compose" as NavKey,
        cta: "Open compose",
      },
      {
        id: "stop-5",
        step: "05",
        title: "Close with team expansion",
        detail:
          "Finish in Workspaces to show multi-brand collaboration, approval chains and the path into larger accounts.",
        target: "workspaces" as NavKey,
        cta: "Open workspaces",
      },
    ]

    return (
      <section className="page-single">
        <div className="panel panel-lg">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Demo Flow</p>
              <h1>The shortest path from market pain to moat, monetization, workflow and expansion.</h1>
            </div>
            <button className="primary-button" type="button" onClick={() => setActiveNav("landing")}>
              Start from landing
            </button>
          </div>

          <div className="hero-stats">
            <div className="metric-card">
              <span>Presentation length</span>
              <strong>3 min</strong>
            </div>
            <div className="metric-card">
              <span>Core stops</span>
              <strong>{demoStops.length}</strong>
            </div>
            <div className="metric-card">
              <span>Priority networks</span>
              <strong>5</strong>
            </div>
          </div>

          <div className="overview-layout">
            <div className="stack">
              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Investor walkthrough</h2>
                <p>Use this sequence so the product lands as a company with a moat, not just as a polished interface.</p>
                  </div>
                </div>
                <div className="demo-stop-list">
                  {demoStops.map((stop) => (
                    <div key={stop.id} className="demo-stop-card">
                      <div className="demo-stop-index">{stop.step}</div>
                      <div className="demo-stop-copy">
                        <strong>{stop.title}</strong>
                        <p>{stop.detail}</p>
                      </div>
                      <button className="secondary-button" type="button" onClick={() => setActiveNav(stop.target)}>
                        {stop.cta}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Speaker notes</h2>
                    <p>What to emphasize while moving through the product live.</p>
                  </div>
                </div>
                <div className="timeline-grid">
                  <div className="timeline-card">
                    <span className="mode-badge mode-live">Moat</span>
                    <strong>Direct API ownership</strong>
                    <p>Say clearly that integrations are part of the product, not outsourced to a reseller layer.</p>
                  </div>
                  <div className="timeline-card">
                    <span className="mode-badge mode-demo">Revenue</span>
                    <strong>Expansion by workflow complexity</strong>
                    <p>Pricing grows with channels, roles, analytics and approvals rather than only post volume.</p>
                  </div>
                  <div className="timeline-card">
                    <span className="mode-badge mode-demo">Vision</span>
                    <strong>From operator tool to system of record</strong>
                    <p>Position MoOn as the control plane for social operations across brands and teams.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="stack">
              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Demo checklist</h2>
                    <p>Quick guardrails before you start the live walkthrough.</p>
                  </div>
                </div>
                <ul className="check-list">
                  <li>
                    <CheckCheck size={16} />
                    Start from the landing so the first impression is product, not admin UI.
                  </li>
                  <li>
                    <CheckCheck size={16} />
                    Mention Instagram, TikTok, LinkedIn, Facebook and YouTube explicitly.
                  </li>
                  <li>
                    <CheckCheck size={16} />
                    Use Billing and Workspaces to prove this is a company, not a feature.
                  </li>
                  <li>
                    <CheckCheck size={16} />
                    Finish in Compose or Queue to show the workflow is grounded in actual product behavior.
                  </li>
                </ul>
              </div>

              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Fast links</h2>
                    <p>Jump points for the live presentation.</p>
                  </div>
                </div>
                <div className="catalog-flags">
                  <button className="secondary-button" type="button" onClick={() => setActiveNav("landing")}>
                    Landing
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setActiveNav("board")}>
                    Investor board
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setActiveNav("integrations")}>
                    Integrations
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setActiveNav("billing")}>
                    Billing
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setActiveNav("overview")}>
                    Overview
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setActiveNav("compose")}>
                    Compose
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setActiveNav("workspaces")}>
                    Workspaces
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function renderBoard() {
    return (
      <section className="page-single">
        <div className="panel panel-lg">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Investor Board</p>
              <h1>The company story in one operating view: market, monetization, launch stack and expansion path.</h1>
            </div>
            <button className="primary-button" type="button" onClick={() => setActiveNav("integrations")}>
              Open launch stack
            </button>
          </div>

          <div className="hero-stats">
            <div className="metric-card">
              <span>Priority providers</span>
              <strong>{launchPlatforms.length}</strong>
            </div>
            <div className="metric-card">
              <span>Sample launch accounts</span>
              <strong>{accounts.filter((account) => launchPlatforms.includes(account.platform as LaunchPlatform)).length}</strong>
            </div>
            <div className="metric-card">
              <span>Configured providers</span>
              <strong>{configuredProviders}</strong>
            </div>
          </div>

          <div className="overview-layout">
            <div className="stack">
              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Board summary</h2>
                    <p>This is the top-level operating picture you can narrate before opening workflow screens.</p>
                  </div>
                </div>
                <div className="timeline-grid">
                  {investorLens.map((lens) => (
                    <div key={lens.id} className="timeline-card">
                      <span className="mode-badge mode-live">{lens.label}</span>
                      <strong>{lens.headline}</strong>
                      <p>{lens.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Commercial efficiency</h2>
                    <p>The product earns the right to charge more as workflow complexity and governance needs increase.</p>
                  </div>
                </div>
                <div className="timeline-grid">
                  {roiSignals.map((signal) => (
                    <div key={signal.id} className="timeline-card">
                      <span className="mode-badge mode-live">{signal.metric}</span>
                      <strong>{signal.title}</strong>
                      <p>{signal.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="stack">
              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Target accounts</h2>
                    <p>These are the buyer profiles that justify having LinkedIn, Facebook and YouTube in the same product.</p>
                  </div>
                </div>
                <div className="workspace-grid">
                  {buyerSegments.map((segment) => (
                    <div key={segment.id} className="workspace-card">
                      <strong>{segment.title}</strong>
                      <p>{segment.team}</p>
                      <div className="workspace-foot">
                        <span>{segment.pain}</span>
                      </div>
                      <div className="catalog-flags">
                        <span className="platform-pill">{segment.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Launch stack status</h2>
                    <p>The product can already show the multi-network surface that matters for the first GTM story.</p>
                  </div>
                </div>
                <div className="activity-list">
                  {launchPlatforms.map((platform) => {
                    const account = accounts.find((item) => item.platform === platform)
                    const provider = config.providers[platform]
                    const status = getProviderStatus(platform, provider)
                    return (
                      <div key={platform} className="activity-card">
                        <div className="activity-head">
                          <div className="catalog-platform">
                            <span className="dot" style={{ backgroundColor: platformAccent(platform) }} />
                            <strong>{platformLabel(platform)}</strong>
                          </div>
                          <span className={clsx("mode-badge", status.ready ? "mode-live" : "mode-demo")}>
                            {status.ready ? "config visible" : "setup pending"}
                          </span>
                        </div>
                        <p>{providerBuyerCase[platform].buyer}</p>
                        <div className="catalog-flags">
                          <span className="platform-pill">{account ? accountModeLabel(account.mode) : "not linked"}</span>
                          <span className="platform-pill">{platformPlaybooks[platform].setting}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function renderOverview() {
    return (
      <section className="page-single">
        <div className="panel panel-lg">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Overview</p>
              <h1>Direct social publishing for teams that need one source of truth across content, accounts, approvals and delivery.</h1>
              </div>
            <button className="ghost-button" type="button" onClick={() => setActiveNav("compose")}>
              <Send size={16} />
              Open composer
            </button>
          </div>

          <div className="hero-stats">
            <div className="metric-card">
              <span>Networks in roadmap</span>
              <strong>{supportedPlatforms.length}</strong>
            </div>
            <div className="metric-card">
              <span>Configured providers</span>
              <strong>{configuredProviders}</strong>
            </div>
            <div className="metric-card">
              <span>Recent operator events</span>
              <strong>{activity.length}</strong>
            </div>
          </div>

          <div className="overview-layout">
            <div className="stack">
              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Why this product exists</h2>
                    <p>MoOn replaces fragmented social tooling with direct provider connectivity, one publishing system and a modular network layer that can keep expanding.</p>
                  </div>
                </div>
                <div className="thesis-grid">
                  <div className="thesis-card">
                    <strong>No reseller dependency</strong>
                    <p>Connections map to official provider APIs, which keeps margin, control and extensibility on our side.</p>
                  </div>
                  <div className="thesis-card">
                    <strong>Operator-first UX</strong>
                    <p>Composer, calendar, queue and provider settings stay in one shell instead of scattering daily work across multiple tools.</p>
                  </div>
                  <div className="thesis-card">
                    <strong>Expandable network layer</strong>
                    <p>Instagram and TikTok open the wedge, while LinkedIn, Facebook, YouTube and the rest grow the same contract into a bigger market.</p>
                  </div>
                </div>
              </div>

              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Roadmap in plain terms</h2>
                    <p>The investor story is phased: presentable now, sellable next, operational after worker + OAuth hardening.</p>
                  </div>
                </div>
                <div className="timeline-grid">
                  <div className="timeline-card">
                    <span className="mode-badge mode-live">Now</span>
                    <strong>Investor-ready demo</strong>
                    <p>Unified shell, provider matrix, account runway, scheduling flow, pricing posture and execution narrative.</p>
                  </div>
                  <div className="timeline-card">
                    <span className="mode-badge mode-demo">Next 30 days</span>
                    <strong>True MVP</strong>
                    <p>Supabase auth, asset storage, live OAuth for Instagram/TikTok, backend posting jobs and publication receipts.</p>
                  </div>
                  <div className="timeline-card">
                    <span className="mode-badge mode-demo">Next 90 days</span>
                    <strong>Commercial scale</strong>
                    <p>Workspaces, approvals, analytics ingestion, billing enforcement and customer-facing onboarding.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="stack">
              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Commercial packaging</h2>
                    <p>Three plans keep the sales motion simple while leaving clear room for agency and enterprise expansion.</p>
                  </div>
                </div>
                <div className="check-list">
                  <li>
                    <CreditCard size={16} />
                    Starter: solo creator or founder, 3 channels, lightweight queue.
                  </li>
                  <li>
                    <CreditCard size={16} />
                    Growth: teams with 10+ channels, analytics and brand-safe approval flow.
                  </li>
                  <li>
                    <CreditCard size={16} />
                    Scale: unlimited workspaces, SSO, API access and onboarding support.
                  </li>
                </div>
              </div>

              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Target customers</h2>
                    <p>The buyer map makes LinkedIn, Facebook and YouTube feel commercially necessary, not decorative.</p>
                  </div>
                </div>
                <div className="workspace-grid">
                  {buyerSegments.map((segment) => (
                    <div key={segment.id} className="workspace-card">
                      <strong>{segment.title}</strong>
                      <p>{segment.team}</p>
                      <div className="workspace-foot">
                        <span>{segment.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Activity feed</h2>
                    <p>Recent product actions keep the demo feeling alive and operational.</p>
                  </div>
                  <span className="platform-pill">live UI state</span>
                </div>
                <div className="activity-list">
                  {activity.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="activity-card">
                      <div className="activity-head">
                        <div className="catalog-platform">
                          <Activity size={14} />
                          <strong>{entry.title}</strong>
                        </div>
                        <span className="platform-pill">{entry.category}</span>
                      </div>
                      <p>{entry.detail}</p>
                      <div className="catalog-flags">
                        <span className="platform-pill">{format(new Date(entry.at), "dd/MM HH:mm")}</span>
                        {entry.platform ? (
                          <span className="platform-pill">{platformLabel(entry.platform)}</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Launch provider stack</h2>
                    <p>Instagram and TikTok drive the first wedge, while LinkedIn, Facebook and YouTube widen the revenue story into brand and B2B use cases.</p>
                  </div>
                </div>
                <div className="provider-spotlight-grid">
                  {launchPlatforms.map((platform) => {
                    const provider = config.providers[platform]
                    const providerStatus = getProviderStatus(platform, provider)
                    return (
                      <div key={platform} className="spotlight-card">
                        <div className="catalog-top">
                          <div className="catalog-platform">
                            <span className="dot" style={{ backgroundColor: platformAccent(platform) }} />
                            <strong>{platformLabel(platform)}</strong>
                          </div>
                          <span className={clsx("mode-badge", providerStatus.ready ? "mode-live" : "mode-demo")}>
                            {providerStatus.ready ? "ready" : "setup pending"}
                          </span>
                        </div>
                        <p>{platformPlaybooks[platform].output}</p>
                        <div className="integration-meta">
                          <div className="readiness-line">
                            <span>Buyer</span>
                            <strong>{providerBuyerCase[platform].buyer}</strong>
                          </div>
                          <div className="readiness-line">
                            <span>Revenue angle</span>
                            <strong>{providerBuyerCase[platform].upside}</strong>
                          </div>
                        </div>
                        <div className="catalog-flags">
                          <span className="platform-pill">{platformPlaybooks[platform].setting}</span>
                          <span className="platform-pill">{platformPlaybooks[platform].limit}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function renderCalendar() {
    const monthDays = Array.from({ length: 14 }, (_, index) => {
      const date = addDays(startOfDay(new Date()), index)
      const linkedPost = scheduledPosts.find(
        (post) =>
          format(new Date(post.scheduledAt), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      )
      return {
        iso: format(date, "yyyy-MM-dd"),
        label: format(date, "dd MMM"),
        weekday: format(date, "EEE"),
        post: linkedPost,
      }
    })

    return (
      <section className="page-single">
        <div className="panel panel-lg">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Calendar</p>
              <h1>Scheduled content by day and by platform cluster</h1>
            </div>
          </div>

          <div className="hero-stats">
            <div className="metric-card">
              <span>Scheduled this fortnight</span>
              <strong>{scheduledPosts.length}</strong>
            </div>
            <div className="metric-card">
              <span>Drafts waiting</span>
              <strong>{posts.filter((post) => post.status === "draft").length}</strong>
            </div>
            <div className="metric-card">
              <span>Networks in motion</span>
              <strong>{selectedPlatforms.length}</strong>
            </div>
          </div>

          <div className="calendar-layout">
            <div className="calendar-planner">
              {monthDays.map((day) => (
                <div
                  key={day.iso}
                  className={clsx("planner-cell", day.post && "planner-cell-active")}
                >
                  <div className="planner-head">
                    <strong>{day.label}</strong>
                    <span>{day.weekday}</span>
                  </div>
                  {day.post ? (
                    <div className="planner-post">
                      <div className="platform-inline">
                        {day.post.platforms.map((platform) => (
                          <span key={platform} className="platform-pill">
                            {platformLabel(platform)}
                          </span>
                        ))}
                      </div>
                      <span>{day.post.copy}</span>
                    </div>
                  ) : (
                    <span className="planner-empty">Open slot</span>
                  )}
                </div>
              ))}
            </div>

            <div className="calendar-board">
              <div className="calendar-board-item">
                <strong>Smart queue guidance</strong>
                <span>Instagram and LinkedIn have capacity for one more launch slot next week.</span>
              </div>
              <div className="calendar-board-item">
                <strong>Best next window</strong>
                <span>Friday 12:30 for TikTok motion cut, Monday 09:00 for LinkedIn company update.</span>
              </div>
              <div className="calendar-board-item">
                <strong>Review pressure</strong>
                <span>{posts.filter((post) => post.status === "draft").length} draft requires operator review before it can enter the queue.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function renderAccounts() {
    return (
      <section className="page-single">
        <div className="panel panel-lg">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Accounts</p>
              <h1>Connected networks, sample accounts and launch readiness stay visible in one SaaS surface.</h1>
            </div>
          </div>

          <div className="hero-stats">
            <div className="metric-card">
              <span>Connected accounts</span>
              <strong>{connectedAccounts}</strong>
            </div>
            <div className="metric-card">
              <span>Live accounts</span>
              <strong>{liveAccounts}</strong>
            </div>
            <div className="metric-card">
              <span>Providers with visible config</span>
              <strong>{configuredProviders}</strong>
            </div>
          </div>

          <div className="grid-two account-overview-grid">
            <div className="subpanel">
              <div className="subpanel-header">
                <div>
                  <h2>Launch checklist</h2>
                  <p>The remaining operator work before sample accounts become real production connections.</p>
                </div>
              </div>
              <ul className="check-list">
                <li>
                  <Radio size={16} />
                  Replace sample Instagram and TikTok entries with real OAuth authorizations
                </li>
                <li>
                  <Radio size={16} />
                  Add LinkedIn, Facebook and YouTube production credentials in Settings
                </li>
                <li>
                  <Radio size={16} />
                  Move queue execution from local UI state to Supabase cron or worker runtime
                </li>
              </ul>
            </div>

            <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Account state model</h2>
                  <p>Sample and live states stay explicit so the product never pretends a provider is ready when it is not.</p>
                </div>
              </div>
              <div className="policy-grid">
                <div className="policy-card">
                  <span className="mode-badge mode-demo">sample</span>
                  <p>Useful for onboarding, previews and sales demos. It does not imply real tokens or publish rights.</p>
                </div>
                <div className="policy-card">
                  <span className="mode-badge mode-live">live</span>
                  <p>Credentialed provider with real operator intent and publish eligibility.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="subpanel accounts-runway">
            <div className="subpanel-header">
              <div>
                <h2>Connection runway</h2>
                <p>Every network exposes the same SaaS checkpoints: credentials, callback URL, account state and connection action.</p>
              </div>
            </div>
            <div className="readiness-grid">
              {providerReadinessRows.map((row) => (
                <div key={row.platform} className="readiness-card">
                  <div className="readiness-head">
                    <div className="catalog-platform">
                      <span
                        className="dot"
                        style={{ backgroundColor: platformAccent(row.platform) }}
                      />
                      <strong>{platformLabel(row.platform)}</strong>
                    </div>
                    <span className="platform-pill">{row.category}</span>
                  </div>
                  <div className="readiness-line">
                    <span>Credentials</span>
                      <strong>{row.hasConfig ? "Loaded" : "Pending"}</strong>
                  </div>
                  <div className="readiness-line">
                    <span>Callback</span>
                    <strong>{row.callback.replace("https://", "")}</strong>
                  </div>
                  <div className="readiness-line">
                    <span>Account</span>
                    <strong>
                      {row.account
                        ? `${accountModeLabel(row.account.mode)} · ${row.account.status}`
                        : "Missing"}
                    </strong>
                  </div>
                  <div className="catalog-flags">
                  <span className={clsx("mode-badge", row.hasConfig ? "mode-live" : "mode-demo")}>
                      {row.hasConfig ? "ready to connect" : "setup needed"}
                    </span>
                    <span
                      className={clsx(
                        "status-badge",
                        row.account?.status === "connected" ? "status-ok" : "status-risk"
                      )}
                    >
                      {row.account?.status ?? "not connected"}
                    </span>
                  </div>
                  <div className="readiness-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => setConnectingPlatform(row.platform)}
                    >
                      <ShieldCheck size={16} />
                      Connect provider
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => setActiveNav("settings")}
                    >
                      <KeyRound size={16} />
                      Review config
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="platform-catalog">
            {supportedPlatforms.map((platform) => {
              const linkedAccount = accounts.find((item) => item.platform === platform.key)
              const provider = config.providers[platform.key]
              const hasVisibleConfig = getProviderStatus(platform.key, provider).ready
              return (
                <div key={platform.key} className="catalog-card">
                  <div className="catalog-top">
                    <div className="catalog-platform">
                      <span className="dot" style={{ backgroundColor: platform.accent }} />
                      <strong>{platform.label}</strong>
                    </div>
                   <span className={clsx("status-badge", linkedAccount ? "status-ok" : "status-risk")}>
                      {linkedAccount ? accountModeLabel(linkedAccount.mode) : "not connected"}
                    </span>
                  </div>
                  <p>
                    {linkedAccount
                      ? `${linkedAccount.name} is shown as a ${accountModeLabel(linkedAccount.mode)} account. Load credentials in Settings, then upgrade it into a real publishing connection.`
                      : "No account is connected yet. Add API credentials first, then start the OAuth connection flow."}
                  </p>
                  <div className="catalog-flags">
                    <span className={clsx("mode-badge", hasVisibleConfig ? "mode-live" : "mode-demo")}>
                      {hasVisibleConfig ? "credentials loaded" : "credentials pending"}
                    </span>
                    <span className="platform-pill">{platform.category}</span>
                    {linkedAccount ? (
                      <span className="platform-pill">{linkedAccount.handle}</span>
                    ) : null}
                  </div>
                  <div className="env-list compact-env-list">
                    <code>
                      {platform.envPublicKey || "PUBLIC_KEY"}:{" "}
                      {provider.publicValue || getProviderExampleValue(platform.key)}
                    </code>
                    {platform.envSecretKey ? (
                      <code>
                        {platform.envSecretKey}:{" "}
                        {provider.secretValue || getProviderSecretExample(platform.key)}
                      </code>
                    ) : null}
                    {platform.envRedirectKey ? (
                      <code>
                        {platform.envRedirectKey}:{" "}
                        {provider.redirectValue || getProviderCallback(platform.key)}
                      </code>
                    ) : null}
                  </div>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => addPlaceholderAccount(platform.key)}
                  >
                    Add sample account
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  function renderQueue() {
    return (
      <section className="page-single">
        <div className="panel panel-lg">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Queue</p>
              <h1>Publishing queue, grouped by schedule and provider mix</h1>
            </div>
          </div>
          <div className="queue-health-strip">
            <span className="platform-pill">{scheduledPosts.length} scheduled jobs</span>
            <span className="platform-pill">{posts.filter((post) => post.status === "draft").length} drafts</span>
            <span className="platform-pill">{liveAccounts} live account(s)</span>
          </div>
          <div className="queue-table">
            {posts.map((post) => (
              <div key={post.id} className="queue-row">
                <div>
                  <div className="queue-title-row">
                    <strong>{post.status}</strong>
                    <span
                      className={clsx(
                        "status-badge",
                        post.status === "published"
                          ? "status-ok"
                          : post.status === "scheduled"
                            ? "mode-live"
                            : "status-risk"
                      )}
                    >
                      {post.status === "draft"
                        ? "needs review"
                        : post.status === "scheduled"
                          ? "queued"
                          : "completed"}
                    </span>
                  </div>
                  <span>{post.copy}</span>
                </div>
                <div className="queue-meta">
                  <span>{format(new Date(post.scheduledAt), "dd/MM/yyyy HH:mm")}</span>
                  <div className="platform-inline">
                    {post.platforms.map((platform) => (
                      <span key={platform} className="platform-pill">
                        {platformLabel(platform)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="queue-summary-grid">
            <div className="subpanel">
              <div className="subpanel-header">
                <div>
                  <h2>Execution notes</h2>
                  <p>What still separates the current queue surface from a fully automated publishing runtime.</p>
                </div>
              </div>
              <ul className="check-list">
                <li>
                  <Clock3 size={16} />
                  BullMQ or Supabase cron still needs to own actual timed execution.
                </li>
                <li>
                  <Clock3 size={16} />
                  Retry policy and provider-specific error surfaces are not yet wired to backend state.
                </li>
                <li>
                  <Clock3 size={16} />
                  Published confirmations are still represented in local app state only.
                </li>
              </ul>
            </div>

            <div className="subpanel">
              <div className="subpanel-header">
                <div>
                  <h2>Launch readiness</h2>
                  <p>Queue readiness is visible, with the remaining execution gaps kept explicit.</p>
                </div>
              </div>
              <div className="catalog-flags">
                <span className="mode-badge mode-live">operator flow</span>
                <span className="mode-badge mode-demo">worker layer next</span>
                <span className="mode-badge mode-demo">publish runtime next</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function renderSettings() {
    return (
      <section className="page-single">
        <div className="panel panel-lg">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Settings</p>
              <h1>Provider setup, workspace readiness and deployment posture</h1>
            </div>
          </div>

          <div className="settings-grid">
            <div className="subpanel full-span">
              <div className="subpanel-header">
                <div>
                  <h2>Quick setup presets</h2>
                  <p>Fast-fill the launch networks while keeping the provider model, placeholders and readiness state explicit.</p>
                </div>
                <button className="primary-button" type="button" onClick={seedLaunchStack}>
                  Seed launch stack
                </button>
              </div>
              <div className="catalog-flags">
                <button className="secondary-button" type="button" onClick={() => seedProviderConfig("instagram")}>
                  Instagram preset
                </button>
                <button className="secondary-button" type="button" onClick={() => seedProviderConfig("tiktok")}>
                  TikTok preset
                </button>
                <button className="secondary-button" type="button" onClick={() => seedProviderConfig("linkedin")}>
                  LinkedIn preset
                </button>
                <button className="secondary-button" type="button" onClick={() => seedProviderConfig("facebook")}>
                  Facebook preset
                </button>
                <button className="secondary-button" type="button" onClick={() => seedProviderConfig("youtube")}>
                  YouTube preset
                </button>
              </div>
            </div>

            <div className="subpanel full-span">
              <div className="subpanel-header">
                <div>
                  <h2>Workspace persistence</h2>
                  <p>Workspace state can stay local today or sync into Supabase as soon as infrastructure is ready.</p>
                </div>
                <span
                  className={clsx(
                    "mode-badge",
                    cloudMode === "synced"
                      ? "mode-live"
                      : cloudMode === "error"
                        ? "status-risk"
                        : "mode-demo"
                  )}
                >
                  {cloudMode === "local"
                    ? "local state"
                    : cloudMode === "loading"
                      ? "syncing now"
                      : cloudMode === "synced"
                        ? "supabase synced"
                        : "sync issue"}
                </span>
              </div>
              <div className="provider-matrix">
                <div className="provider-matrix-row">
                  <strong>Workspace profile</strong>
                  <span className="platform-pill">{workspace.plan}</span>
                  <span className="platform-pill">{workspace.timezone}</span>
                </div>
                <div className="provider-matrix-row">
                  <strong>Accounts cached</strong>
                  <span className="platform-pill">{accounts.length}</span>
                  <span className="platform-pill">{liveAccounts} live</span>
                </div>
                <div className="provider-matrix-row">
                  <strong>Posts cached</strong>
                  <span className="platform-pill">{posts.length}</span>
                  <span className="platform-pill">{scheduledPosts.length} scheduled</span>
                </div>
                <div className="provider-matrix-row">
                  <strong>Media linked</strong>
                  <span className="platform-pill">{selectedAssetIds.length}</span>
                  <span className="platform-pill">workspace_state</span>
                </div>
              </div>
            </div>

            <div className="subpanel full-span">
              <div className="subpanel-header">
                <div>
                  <h2>Environment map</h2>
                  <p>This is the SaaS-facing config contract: what the operator must add, where it belongs, and which callback each network expects.</p>
                </div>
              </div>
              <div className="provider-matrix">
                {supportedPlatforms.map((platform) => {
                  const provider = config.providers[platform.key]
                  return (
                    <div key={`${platform.key}-env`} className="provider-env-card">
                      <div className="catalog-platform">
                        <span className="dot" style={{ backgroundColor: platform.accent }} />
                        <strong>{platform.label}</strong>
                      </div>
                      <div className="env-list compact-env-list">
                        <code>{platform.envPublicKey || "PUBLIC_KEY"}: {provider.publicValue || getProviderExampleValue(platform.key)}</code>
                        {platform.envSecretKey ? (
                          <code>{platform.envSecretKey}: {provider.secretValue || getProviderSecretExample(platform.key)}</code>
                        ) : null}
                        {platform.envRedirectKey ? (
                          <code>{platform.envRedirectKey}: {provider.redirectValue || getProviderCallback(platform.key)}</code>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="subpanel full-span">
              <div className="subpanel-header">
                  <div>
                    <h2>Provider matrix</h2>
                  <p>Every network is visible, credential readiness is explicit, and the onboarding path is consistent across the stack.</p>
                  </div>
                </div>
              <div className="provider-matrix">
                {supportedPlatforms.map((platform) => {
                  const provider = config.providers[platform.key]
                  const configured = getProviderStatus(platform.key, provider).ready
                  return (
                    <div key={platform.key} className="provider-matrix-row">
                      <div className="catalog-platform">
                        <span className="dot" style={{ backgroundColor: platform.accent }} />
                        <strong>{platform.label}</strong>
                      </div>
                      <span className="platform-pill">{platform.category}</span>
                      <span className={clsx("mode-badge", configured ? "mode-live" : "mode-demo")}>
                        {configured ? "configured" : "setup pending"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="subpanel">
              <div className="subpanel-header">
                <div>
                  <h2>Workspace</h2>
                  <p>Identity shown across the landing, workspace shell and customer-facing flows.</p>
                </div>
              </div>
              <label className="field">
                <span>Workspace name</span>
                <input
                  value={workspace.name}
                  onChange={(event) =>
                    setWorkspace((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                <span>Owner email</span>
                <input
                  value={workspace.owner}
                  onChange={(event) =>
                    setWorkspace((current) => ({ ...current, owner: event.target.value }))
                  }
                />
              </label>
              <div className="grid-two">
                <label className="field">
                  <span>Plan</span>
                  <input
                    value={workspace.plan}
                    onChange={(event) =>
                      setWorkspace((current) => ({ ...current, plan: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Timezone</span>
                  <input
                    value={workspace.timezone}
                    onChange={(event) =>
                      setWorkspace((current) => ({ ...current, timezone: event.target.value }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="subpanel">
              <div className="subpanel-header">
                <div>
                  <h2>Supabase</h2>
                  <p>Used for auth, storage, account persistence and durable posting state.</p>
                </div>
                <span className={clsx("mode-badge", hasSupabaseEnv ? "mode-live" : "mode-demo")}>
                  {hasSupabaseEnv ? "connected" : "not connected"}
                </span>
              </div>
              <label className="field">
                <span>Project URL</span>
                <input
                  value={config.supabaseUrl}
                  placeholder="https://your-project.supabase.co"
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, supabaseUrl: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                <span>Publishable key</span>
                <input
                  value={config.supabasePublishableKey}
                  placeholder="sb_publishable_xxxxxxxxxxxxxxxxx"
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      supabasePublishableKey: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            {supportedPlatforms.map((platform) => {
              const provider = config.providers[platform.key]
              const placeholders = getProviderPlaceholders(platform.key)
              const status = getProviderStatus(platform.key, provider)
              return (
                <div key={platform.key} className="subpanel">
                  <div className="subpanel-header">
                    <div>
                      <h2>{platform.label}</h2>
                      <p>{platform.category === "oauth" ? "OAuth client config" : "Token-based provider config"}</p>
                    </div>
                    <span
                      className={clsx(
                        "mode-badge",
                        status.ready ? "mode-live" : "mode-demo"
                      )}
                    >
                      {status.ready ? "configured" : "setup pending"}
                    </span>
                  </div>
                  <div className="catalog-flags provider-action-strip">
                    <span className="platform-pill">{platform.envPublicKey || "public env"}</span>
                    {platform.envSecretKey ? (
                      <span className="platform-pill">{platform.envSecretKey}</span>
                    ) : null}
                    {demoProviderSeeds[platform.key] ? (
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => seedProviderConfig(platform.key)}
                      >
                        Load example
                      </button>
                    ) : null}
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        setActiveNav("accounts")
                        setConnectingPlatform(platform.key)
                      }}
                    >
                      Open connection
                    </button>
                  </div>
                  <label className="field">
                    <span>{platform.envPublicKey || "Public identifier"}</span>
                    <input
                      value={provider.publicValue}
                      placeholder={placeholders.publicValue}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          providers: {
                            ...current.providers,
                            [platform.key]: {
                              ...current.providers[platform.key],
                              publicValue: event.target.value,
                            },
                          },
                        }))
                      }
                    />
                  </label>
                  <p className="support-text">
                    Example value: {getProviderExampleValue(platform.key)}
                  </p>
                  <label className="field">
                    <span>{platform.envSecretKey || "Secret"}</span>
                    <input
                      value={provider.secretValue}
                      placeholder={placeholders.secretValue}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          providers: {
                            ...current.providers,
                            [platform.key]: {
                              ...current.providers[platform.key],
                              secretValue: event.target.value,
                            },
                          },
                        }))
                      }
                    />
                  </label>
                  <p className="support-text">
                    Example secret: {getProviderSecretExample(platform.key)}
                  </p>
                  {platform.envRedirectKey ? (
                    <label className="field">
                      <span>{platform.envRedirectKey}</span>
                      <input
                        value={provider.redirectValue}
                        placeholder={placeholders.redirectValue}
                        onChange={(event) =>
                          setConfig((current) => ({
                            ...current,
                            providers: {
                              ...current.providers,
                              [platform.key]: {
                                ...current.providers[platform.key],
                                redirectValue: event.target.value,
                              },
                            },
                          }))
                        }
                      />
                    </label>
                  ) : null}
                  <p className="support-text">
                    Callback: {getProviderCallback(platform.key)} · readiness:{" "}
                    {status.publicReady
                      ? status.secretReady
                        ? "ready to connect"
                        : "secret pending"
                      : "client id pending"}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  function renderAnalytics() {
    return (
      <section className="page-single">
        <div className="panel panel-lg">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Analytics</p>
              <h1>Operator metrics stay tied to networks, not to a generic dashboard shell.</h1>
            </div>
          </div>

          <div className="hero-stats">
            <div className="metric-card">
              <span>Reach this week</span>
              <strong>42.6K</strong>
            </div>
            <div className="metric-card">
              <span>Engagement rate</span>
              <strong>4.8%</strong>
            </div>
            <div className="metric-card">
              <span>Clicks attributed</span>
              <strong>1,284</strong>
            </div>
          </div>

          <div className="analytics-layout">
            <div className="analytics-table">
              {analyticsRows.map((row) => (
                <div key={row.platform} className="analytics-row">
                  <div className="analytics-row-top">
                    <div className="catalog-platform">
                      <span
                        className="dot"
                        style={{ backgroundColor: platformAccent(row.platform) }}
                      />
                      <strong>{platformLabel(row.platform)}</strong>
                    </div>
                    <span className="platform-pill">{row.engagement} ER</span>
                  </div>
                  <div className="analytics-metrics">
                    <span>Reach {row.reach}</span>
                    <span>Clicks {row.clicks}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${row.score}%` }} />
                  </div>
                  <p>{row.note}</p>
                </div>
              ))}
            </div>

            <div className="analytics-side">
              <div className="calendar-board-item">
                <strong>Best performer</strong>
                <span>Instagram holds the strongest blended reach and conversion score this week.</span>
              </div>
              <div className="calendar-board-item">
                <strong>Paid-ready channel</strong>
                <span>LinkedIn copy variants are strongest for high-intent outbound traffic.</span>
              </div>
              <div className="calendar-board-item">
                <strong>Blocked visibility</strong>
                <span>YouTube, Facebook and Pinterest analytics remain forecasted until credentials move from placeholder to live.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function renderMedia() {
    return (
      <section className="page-single">
        <div className="panel panel-lg">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Media</p>
              <h1>Reusable creative assets, sized for different networks and ready for operator reuse.</h1>
            </div>
          </div>

          <div className="media-grid">
            {mediaAssets.map((asset) => (
              <div key={asset.id} className="media-card">
                <div className={clsx("media-thumb", `media-tone-${asset.tone}`)}>
                  <div className="media-thumb-overlay">
                    <span className="platform-pill">{asset.type}</span>
                    <span className="platform-pill">{asset.ratio}</span>
                  </div>
                </div>
                <div className="media-meta-block">
                  <strong>{asset.name}</strong>
                  <p>{asset.size} · {asset.type}</p>
                  <div className="catalog-flags">
                    {asset.platforms.map((platform) => (
                      <span key={platform} className="platform-pill">
                        {platformLabel(platform)}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="secondary-button" type="button">
                  Reuse asset
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  function renderTemplates() {
    return (
      <section className="page-single">
        <div className="panel panel-lg">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Templates</p>
              <h1>Content systems, not one-off posts.</h1>
            </div>
          </div>

          <div className="templates-layout">
            {templateCards.map((template) => (
              <div key={template.id} className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>{template.title}</h2>
                    <p>{template.summary}</p>
                  </div>
                  <span className="mode-badge mode-live">ready</span>
                </div>
                <div className="catalog-flags">
                  {template.channels.map((platform) => (
                    <span key={platform} className="platform-pill">
                      {platformLabel(platform)}
                    </span>
                  ))}
                </div>
                <ul className="check-list template-variable-list">
                  {template.variables.map((variable) => (
                    <li key={variable}>
                      <CheckCheck size={16} />
                      Variable: <code>{variable}</code>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="subpanel">
              <div className="subpanel-header">
                <div>
                  <h2>Saved hashtag groups</h2>
                  <p>Reusable topic clusters by product line and announcement type.</p>
                </div>
              </div>
              <div className="catalog-flags">
                <span className="platform-pill">#launch</span>
                <span className="platform-pill">#newdrop</span>
                <span className="platform-pill">#creatorcollab</span>
                <span className="platform-pill">#behindthescenes</span>
                <span className="platform-pill">#limitedrelease</span>
              </div>
            </div>

            <div className="subpanel">
              <div className="subpanel-header">
                <div>
                  <h2>Approval posture</h2>
                  <p>What content ops would need before enabling multi-user workflow later.</p>
                </div>
              </div>
              <ul className="check-list">
                <li>
                  <Globe2 size={16} />
                  Copy owner and legal reviewer fields
                </li>
                <li>
                  <Globe2 size={16} />
                  Platform-level approval status before queue insertion
                </li>
                <li>
                  <Globe2 size={16} />
                  Workspace roles on top of Supabase auth
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function renderIntegrations() {
    const priorityProviders = launchPlatforms

    return (
      <section className="page-single">
        <div className="panel panel-lg">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Integrations</p>
              <h1>Direct provider connectivity is a product surface, not a hidden implementation detail.</h1>
            </div>
            <button className="ghost-button" type="button" onClick={() => setActiveNav("settings")}>
              <KeyRound size={16} />
              Open provider config
            </button>
          </div>

          <div className="hero-stats">
            <div className="metric-card">
              <span>Launch providers</span>
              <strong>{priorityProviders.length}</strong>
            </div>
            <div className="metric-card">
              <span>OAuth-based networks</span>
              <strong>{supportedPlatforms.filter((platform) => platform.category === "oauth").length}</strong>
            </div>
            <div className="metric-card">
              <span>Configured today</span>
              <strong>{configuredProviders}</strong>
            </div>
          </div>

          <div className="overview-layout">
            <div className="stack">
              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Priority stack</h2>
                    <p>These five providers tell the strongest market story on day one and cover creator, brand and B2B use cases.</p>
                  </div>
                </div>
                <div className="provider-spotlight-grid">
                  {priorityProviders.map((platform) => {
                    const provider = config.providers[platform]
                    const status = getProviderStatus(platform, provider)
                    const account = accounts.find((item) => item.platform === platform)
                    return (
                      <div key={platform} className="spotlight-card spotlight-card-premium">
                        <div className="catalog-top">
                          <div className="catalog-platform">
                            <span className="dot" style={{ backgroundColor: platformAccent(platform) }} />
                            <strong>{platformLabel(platform)}</strong>
                          </div>
                          <span className={clsx("mode-badge", status.ready ? "mode-live" : "mode-demo")}>
                            {status.ready ? "connection-ready" : "setup pending"}
                          </span>
                        </div>
                        <p>{platformPlaybooks[platform].output}</p>
                        <div className="integration-meta">
                          <div className="readiness-line">
                            <span>Auth model</span>
                            <strong>{supportedPlatforms.find((item) => item.key === platform)?.category}</strong>
                          </div>
                          <div className="readiness-line">
                            <span>Account state</span>
                            <strong>{account ? `${accountModeLabel(account.mode)} · ${account.status}` : "not linked"}</strong>
                          </div>
                          <div className="readiness-line">
                            <span>API settings</span>
                            <strong>{platformPlaybooks[platform].setting}</strong>
                          </div>
                          <div className="readiness-line">
                            <span>Buyer</span>
                            <strong>{providerBuyerCase[platform].buyer}</strong>
                          </div>
                          <div className="readiness-line">
                            <span>Why it matters</span>
                            <strong>{providerBuyerCase[platform].motion}</strong>
                          </div>
                        </div>
                        <div className="catalog-flags">
                          <span className="platform-pill">{platformPlaybooks[platform].limit}</span>
                          <span className="platform-pill">{providerBuyerCase[platform].upside}</span>
                          {providerScopes[platform].slice(0, 2).map((scope) => (
                            <span key={scope} className="platform-pill">
                              {scope}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Expansion catalog</h2>
                    <p>The remaining providers are already visible on the same abstraction, which makes the roadmap easier to trust.</p>
                  </div>
                </div>
                <div className="workspace-grid">
                  {supportedPlatforms
                    .filter((platform) => !priorityProviders.includes(platform.key as (typeof priorityProviders)[number]))
                    .map((platform) => {
                      const provider = config.providers[platform.key]
                      const status = getProviderStatus(platform.key, provider)
                      return (
                        <div key={platform.key} className="workspace-card">
                          <div className="catalog-top">
                            <div className="catalog-platform">
                              <span className="dot" style={{ backgroundColor: platform.accent }} />
                              <strong>{platform.label}</strong>
                            </div>
                            <span className={clsx("mode-badge", status.ready ? "mode-live" : "mode-demo")}>
                              {status.ready ? "visible config" : "roadmap-ready"}
                            </span>
                          </div>
                          <p>{platform.category === "oauth" ? "OAuth client flow" : "Token or identifier flow"}</p>
                          <div className="catalog-flags">
                            <span className="platform-pill">{platform.category}</span>
                            <span className="platform-pill">{platform.envPublicKey || "provider env"}</span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>

            <div className="stack">
              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Why investors should care</h2>
                    <p>Integrations are the moat, the margin story and the future expansion path.</p>
                  </div>
                </div>
                <ul className="check-list">
                  <li>
                    <Rocket size={16} />
                    Direct API ownership reduces dependency on third-party schedulers and protects gross margin.
                  </li>
                  <li>
                    <Rocket size={16} />
                    LinkedIn, Facebook and YouTube move the product beyond creator tooling into brand and B2B workflows.
                  </li>
                  <li>
                    <Rocket size={16} />
                    The same integration contract can be reused across posting, analytics and approval workflows.
                  </li>
                </ul>
              </div>

              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Connection readiness</h2>
                    <p>Operational visibility is explicit: callbacks, scopes and credential posture are part of the UI.</p>
                  </div>
                </div>
                <div className="activity-list">
                  {priorityProviders.map((platform) => {
                    const row = providerReadinessRows.find((item) => item.platform === platform)
                    if (!row) return null
                    return (
                      <div key={platform} className="activity-card">
                        <div className="activity-head">
                          <strong>{platformLabel(platform)}</strong>
                          <span className={clsx("mode-badge", row.hasConfig ? "mode-live" : "mode-demo")}>
                            {row.hasConfig ? "ready" : "pending"}
                          </span>
                        </div>
                        <p>{row.callback.replace("https://", "")}</p>
                        <div className="catalog-flags">
                          <span className="platform-pill">{row.category}</span>
                          <span className="platform-pill">{row.account?.status ?? "not linked"}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function renderWorkspaces() {
    return (
      <section className="page-single">
        <div className="panel panel-lg">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Workspaces</p>
              <h1>Multi-brand collaboration is part of the product story, not a note for later.</h1>
            </div>
            <button className="ghost-button" type="button" onClick={() => setActiveNav("accounts")}>
              <Users2 size={16} />
              Review accounts
            </button>
          </div>

          <div className="hero-stats">
            <div className="metric-card">
              <span>Workspace lanes</span>
              <strong>{workspaceLanes.length}</strong>
            </div>
            <div className="metric-card">
              <span>Team members modeled</span>
              <strong>{teamMembers.length}</strong>
            </div>
            <div className="metric-card">
              <span>Approval-ready networks</span>
              <strong>5</strong>
            </div>
          </div>

          <div className="overview-layout">
            <div className="stack">
              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Workspace lanes</h2>
                    <p>Each lane carries its own operator context, network mix and publishing posture.</p>
                  </div>
                </div>
                <div className="workspace-grid">
                  {workspaceLanes.map((lane) => (
                    <div key={lane.id} className="workspace-card">
                      <strong>{lane.title}</strong>
                      <p>{lane.summary}</p>
                      <div className="catalog-flags">
                        {lane.networks.map((platform) => (
                          <span key={platform} className="platform-pill">
                            {platformLabel(platform)}
                          </span>
                        ))}
                      </div>
                      <div className="workspace-foot">
                        <span>{lane.members.join(" · ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Approval chain</h2>
                    <p>This is the wedge into agency and multi-user accounts.</p>
                  </div>
                </div>
                <div className="timeline-grid">
                  <div className="timeline-card">
                    <span className="mode-badge mode-live">Draft</span>
                    <strong>Content lead review</strong>
                    <p>Caption, CTA, brand safety and channel mix are reviewed before entering queue.</p>
                  </div>
                  <div className="timeline-card">
                    <span className="mode-badge mode-demo">Approve</span>
                    <strong>Operator sign-off</strong>
                    <p>Publishing time, account mapping and network-specific settings are confirmed.</p>
                  </div>
                  <div className="timeline-card">
                    <span className="mode-badge mode-demo">Publish</span>
                    <strong>Execution runtime</strong>
                    <p>Workers and receipts convert the current queue UI into true backend delivery.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="stack">
              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Team roster</h2>
                    <p>Modeled roles help investors read the product as software for teams, not a solo tool.</p>
                  </div>
                </div>
                <div className="activity-list">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="activity-card">
                      <div className="activity-head">
                        <strong>{member.name}</strong>
                        <span
                          className={clsx(
                            "mode-badge",
                            member.status === "active"
                              ? "mode-live"
                              : member.status === "review"
                                ? "status-risk"
                                : "mode-demo"
                          )}
                        >
                          {member.status}
                        </span>
                      </div>
                      <p>{member.role}</p>
                      <div className="workspace-foot">
                        <span>{member.focus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Enterprise signal</h2>
                    <p>The expansion path is visible before the full permissions system is wired.</p>
                  </div>
                </div>
                <ul className="check-list">
                  <li>
                    <ShieldCheck size={16} />
                    Role-based publishing keeps creators, operators and approvers on separate responsibilities.
                  </li>
                  <li>
                    <ShieldCheck size={16} />
                    Workspace-level provider credentials support agencies and multi-brand groups.
                  </li>
                  <li>
                    <ShieldCheck size={16} />
                    Shared media, templates and analytics raise switching cost as the product matures.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function renderBilling() {
    const usageRatio = Math.min(100, Math.round((scheduledPosts.length / 24) * 100))

    return (
      <section className="page-single">
        <div className="panel panel-lg">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Billing</p>
              <h1>Pricing is tied to operational value, team complexity and the expansion path into larger accounts.</h1>
            </div>
          </div>

          <div className="hero-stats">
            <div className="metric-card">
              <span>Current plan</span>
              <strong>{workspace.plan}</strong>
            </div>
            <div className="metric-card">
              <span>Billable channels modeled</span>
              <strong>{selectedPlatforms.length}</strong>
            </div>
            <div className="metric-card">
              <span>Usage against Growth cap</span>
              <strong>{usageRatio}%</strong>
            </div>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card">
              <span className="mode-badge mode-demo">Starter</span>
              <strong>€29/mo</strong>
              <p>For solo operators validating one brand before social workflow becomes a team problem.</p>
              <ul className="check-list">
                <li><CheckCheck size={16} /> 3 social channels</li>
                <li><CheckCheck size={16} /> 30 scheduled posts / month</li>
                <li><CheckCheck size={16} /> Basic media library</li>
              </ul>
              <button className="secondary-button" type="button" onClick={() => switchPlan("Starter")}>
                Select Starter
              </button>
            </div>
            <div className="pricing-card pricing-card-featured">
              <span className="mode-badge mode-live">Growth</span>
              <strong>€99/mo</strong>
              <p>For small teams that need queue control, approvals, analytics narrative and multiple brands in one workspace.</p>
              <ul className="check-list">
                <li><CheckCheck size={16} /> 10 social channels</li>
                <li><CheckCheck size={16} /> Smart queue and calendar views</li>
                <li><CheckCheck size={16} /> Approval states and richer analytics</li>
              </ul>
              <button className="primary-button" type="button" onClick={() => switchPlan("Growth")}>
                Keep Growth
              </button>
            </div>
            <div className="pricing-card">
              <span className="mode-badge mode-demo">Scale</span>
              <strong>Custom</strong>
              <p>For agencies and brand groups that need roles, workspace governance, onboarding and account-level controls.</p>
              <ul className="check-list">
                <li><CheckCheck size={16} /> Unlimited channels</li>
                <li><CheckCheck size={16} /> Multi-workspace governance</li>
                <li><CheckCheck size={16} /> API, SSO and migration support</li>
              </ul>
              <button className="secondary-button" type="button" onClick={() => switchPlan("Scale")}>
                Select Scale
              </button>
            </div>
          </div>

          <div className="queue-summary-grid">
            <div className="subpanel">
              <div className="subpanel-header">
                <div>
                  <h2>Monetization logic</h2>
                  <p>The pricing model scales with the operational pain we remove: channels, seats, approvals, analytics and governance.</p>
                </div>
              </div>
              <div className="meter-card">
                <div className="meter-head">
                  <strong>Growth plan utilization</strong>
                  <span>{scheduledPosts.length}/24 scheduled jobs</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${usageRatio}%` }} />
                </div>
              </div>
              <div className="catalog-flags">
                <span className="platform-pill">channel-based upsell</span>
                <span className="platform-pill">seat expansion</span>
                <span className="platform-pill">enterprise onboarding</span>
              </div>
            </div>

            <div className="subpanel">
              <div className="subpanel-header">
                <div>
                  <h2>Investor notes</h2>
                  <p>What turns this from a useful workflow into a software business.</p>
                </div>
              </div>
              <ul className="check-list">
                <li>
                  <Rocket size={16} />
                  Direct API connectivity supports stronger margins than reseller-dependent schedulers.
                </li>
                <li>
                  <Rocket size={16} />
                  Pricing can map to usage signals that already exist in the product surface today.
                </li>
                <li>
                  <Rocket size={16} />
                  The roadmap naturally expands ARPU through analytics, approvals, workspace roles and enterprise onboarding.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function renderPage() {
    if (activeNav === "landing") return renderLanding()
    if (activeNav === "demo") return renderDemo()
    if (activeNav === "board") return renderBoard()
    if (activeNav === "overview") return renderOverview()
    if (activeNav === "compose") return renderCompose()
    if (activeNav === "calendar") return renderCalendar()
    if (activeNav === "accounts") return renderAccounts()
    if (activeNav === "queue") return renderQueue()
    if (activeNav === "analytics") return renderAnalytics()
    if (activeNav === "media") return renderMedia()
    if (activeNav === "templates") return renderTemplates()
    if (activeNav === "integrations") return renderIntegrations()
    if (activeNav === "workspaces") return renderWorkspaces()
    if (activeNav === "billing") return renderBilling()
    return renderSettings()
  }

  if (activeNav === "landing") {
    return renderLanding()
  }

  return (
    <div className="shell">
      {connectingPlatform ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="panel-header modal-header">
              <div>
                <p className="eyebrow">Connect provider</p>
                <h2>{platformLabel(connectingPlatform)} connection readiness</h2>
              </div>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setConnectingPlatform(null)}
              >
                Close
              </button>
            </div>
            <div className="queue-summary-grid">
              <div className="subpanel">
              <div className="subpanel-header">
                <div>
                  <h2>Checklist</h2>
                    <p>What needs to be true before a provider can move from workspace setup to live publishing.</p>
                  </div>
                </div>
                <ul className="check-list">
                  <li>
                    <ShieldCheck size={16} />
                    Public client loaded:{" "}
                    {providerReadinessRows.find((row) => row.platform === connectingPlatform)?.hasConfig
                      ? "yes"
                      : "no"}
                  </li>
                  <li>
                    <ShieldCheck size={16} />
                    Callback ready: {getProviderCallback(connectingPlatform)}
                  </li>
                  <li>
                    <ShieldCheck size={16} />
                    Cloud mode: {cloudMode}
                  </li>
                </ul>
              </div>
              <div className="subpanel">
                <div className="subpanel-header">
                  <div>
                    <h2>Requested scopes</h2>
                    <p>Visible permissions so the connection flow reads like a real OAuth surface.</p>
                  </div>
                </div>
                <div className="catalog-flags">
                  {providerScopes[connectingPlatform].map((scope) => (
                    <span key={scope} className="platform-pill">
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => setActiveNav("settings")}>
                Review settings
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => connectProvider(connectingPlatform)}
              >
                Connect now
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showOnboarding ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="panel-header modal-header">
              <div>
                <p className="eyebrow">Workspace setup</p>
                <h2>Shape the workspace so the product reads like a real SaaS account.</h2>
              </div>
              <button className="ghost-button" type="button" onClick={() => setShowOnboarding(false)}>
                Close
              </button>
            </div>
            <div className="settings-grid">
              <label className="field">
                <span>Workspace name</span>
                <input
                  value={workspace.name}
                  onChange={(event) =>
                    setWorkspace((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                <span>Owner email</span>
                <input
                  value={workspace.owner}
                  onChange={(event) =>
                    setWorkspace((current) => ({ ...current, owner: event.target.value }))
                  }
                />
              </label>
            </div>
            <div className="check-list onboarding-list">
              <li>
                <Radio size={16} />
                Settings now exposes every supported provider and its connection posture.
              </li>
              <li>
                <Radio size={16} />
                Accounts can stay in workspace mode until real OAuth or token config is loaded.
              </li>
              <li>
                <Radio size={16} />
                All state persists locally, so the workspace survives refreshes.
              </li>
            </div>
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => setActiveNav("settings")}>
                Review settings
              </button>
              <button className="primary-button" type="button" onClick={() => setShowOnboarding(false)}>
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <GalleryVerticalEnd size={16} />
          </div>
          <div>
              <strong>MoOn</strong>
              <span>Direct social publishing platform</span>
            </div>
          </div>

        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                type="button"
                className={clsx("nav-item", activeNav === item.key && "nav-item-active")}
                onClick={() => setActiveNav(item.key)}
              >
                <Icon size={16} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-card">
          <p className="eyebrow">Product snapshot</p>
          <strong>10-platform roadmap, direct provider model, explicit operational readiness.</strong>
          <span>
            Unified publishing, integration depth and team expansion live in one product surface.
          </span>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <strong>{workspace.name}</strong>
            <span>
              {workspace.owner} · {workspace.plan} plan · {workspace.timezone}
            </span>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" type="button" onClick={() => setActiveNav("landing")}>
              Site
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={() => setPresentationMode((current) => !current)}
            >
              {presentationMode ? "Presenter" : "Workspace"}
            </button>
            <button className="ghost-button" type="button" onClick={preparePresentationState}>
              Prepare
            </button>
            <button className="ghost-button" type="button" onClick={resetWorkspaceState}>
              Reset
            </button>
            {presentationMode ? (
              <div className="topbar-badge">
                <Sparkles size={14} />
                Presentation ready
              </div>
            ) : null}
            {!presentationMode ? (
              <>
                <div className="topbar-badge">
                  <Sparkles size={14} />
                  {configuredProviders}/{supportedPlatforms.length} providers configured
                </div>
                <div className="topbar-badge">
                  <Globe2 size={14} />
                  {cloudMode === "local"
                    ? "Local state"
                    : cloudMode === "loading"
                      ? "Supabase syncing"
                      : cloudMode === "synced"
                        ? "Supabase synced"
                        : "Supabase error"}
                </div>
                <button className="ghost-button" type="button" onClick={() => setShowOnboarding(true)}>
                  Setup
                </button>
              </>
            ) : null}
            <button className="primary-button" type="button" onClick={() => setActiveNav("compose")}>
              <Send size={16} />
              New post
            </button>
          </div>
        </header>

        {!presentationMode ? (
          <section className="banner-row">
            <div className="banner-card">
              <BarChart3 size={16} />
              <span>Direct provider control across 10 visible platform modules</span>
            </div>
            <div className="banner-card">
              <Link2 size={16} />
              <span>Instagram, TikTok, LinkedIn, Facebook, YouTube, Pinterest, X, Threads, Bluesky, Telegram</span>
            </div>
          </section>
        ) : null}

        {renderPage()}
      </main>
    </div>
  )
}

export default App
