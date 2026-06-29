import { PlanTier } from "@/lib/domain/enums"

export type PlanLimits = {
  maxChannels: number
  maxPostsPerMonth: number
  apiAccess: boolean
  mcpAccess: boolean
  analytics: boolean
  approvals: boolean
  teamMembers: number
  webhooks: boolean
  firstComment: boolean
  labels: boolean
  whiteLabel: boolean
  /** Revender Postall: dashboard de clientes + facturación (tier Agency). */
  reselling: boolean
  maxClientWorkspaces: number
  /** Brand Agent: generación autónoma de campañas con IA */
  brandAgent: boolean
  /** Connectors: integración con herramientas creativas (Canva, HeyGen, Fliki) */
  connectors: boolean
  /** BYOK: credenciales OAuth/IA propias por workspace (tier Agency) */
  customIntegrations: boolean
}

export type PlanDefinition = {
  tier: PlanTier
  name: string
  priceLabel: string
  monthlyPriceEur: number
  description: string
  limits: PlanLimits
  highlights: string[]
  /** Env var that holds the Stripe price id for this plan. */
  stripePriceEnv?: string
}

export const UNLIMITED = Number.POSITIVE_INFINITY

export const PLANS: Record<PlanTier, PlanDefinition> = {
  [PlanTier.FREE]: {
    tier: PlanTier.FREE,
    name: "Free",
    priceLabel: "0€",
    monthlyPriceEur: 0,
    description: "3 canales gratis de verdad. Sin trucos ni tarjeta.",
    limits: {
      maxChannels: 3,
      maxPostsPerMonth: 15,
      apiAccess: false,
      mcpAccess: false,
      analytics: false,
      approvals: false,
      teamMembers: 1,
      webhooks: false,
      firstComment: false,
      labels: true,
      whiteLabel: false,
      reselling: false,
      maxClientWorkspaces: 0,
      brandAgent: false,
      connectors: false,
      customIntegrations: false,
    },
    highlights: [
      "3 canales gratis (sin pagar al tercero)",
      "15 posts/mes",
      "Calendario, cola y biblioteca",
      "Etiquetas y versiones por red",
    ],
  },
  [PlanTier.CREATOR]: {
    tier: PlanTier.CREATOR,
    name: "Creator",
    priceLabel: "9€/mes",
    monthlyPriceEur: 9,
    description: "Para creadores que publican sin límites en todas las redes.",
    limits: {
      maxChannels: 10,
      maxPostsPerMonth: UNLIMITED,
      apiAccess: false,
      mcpAccess: false,
      analytics: true,
      approvals: true,
      teamMembers: 2,
      webhooks: false,
      firstComment: true,
      labels: true,
      whiteLabel: false,
      reselling: false,
      maxClientWorkspaces: 0,
      brandAgent: false,
      connectors: false,
      customIntegrations: false,
    },
    highlights: [
      "10 canales",
      "Posts ilimitados en todas las redes",
      "Analítica avanzada + IA",
      "Primer comentario, plantillas, hashtags, variables",
    ],
    stripePriceEnv: "STRIPE_PRICE_CREATOR",
  },
  [PlanTier.AGENT]: {
    tier: PlanTier.AGENT,
    name: "Agent",
    priceLabel: "19€/mes",
    monthlyPriceEur: 19,
    description: "Equipo + API + MCP + Webhooks para automatizar con agentes (OpenClaw).",
    limits: {
      maxChannels: 25,
      maxPostsPerMonth: UNLIMITED,
      apiAccess: true,
      mcpAccess: true,
      analytics: true,
      approvals: true,
      teamMembers: 10,
      webhooks: true,
      firstComment: true,
      labels: true,
      whiteLabel: false,
      reselling: false,
      maxClientWorkspaces: 0,
      brandAgent: true,
      connectors: true,
      customIntegrations: false,
    },
    highlights: [
      "25 canales",
      "API REST + servidor MCP + Webhooks",
      "Equipo, roles y aprobaciones",
      "La competencia cobra esto como extra de pago",
    ],
    stripePriceEnv: "STRIPE_PRICE_AGENT",
  },
  [PlanTier.AGENCY]: {
    tier: PlanTier.AGENCY,
    name: "Agency",
    priceLabel: "39€/mes",
    monthlyPriceEur: 39,
    description: "White-label + gestión de clientes para lanzar tu propio SaaS.",
    limits: {
      maxChannels: UNLIMITED,
      maxPostsPerMonth: UNLIMITED,
      apiAccess: true,
      mcpAccess: true,
      analytics: true,
      approvals: true,
      teamMembers: UNLIMITED,
      webhooks: true,
      firstComment: true,
      labels: true,
      whiteLabel: true,
      reselling: true,
      maxClientWorkspaces: 50,
      brandAgent: true,
      connectors: true,
      customIntegrations: true,
    },
    highlights: [
      "Canales y equipo ilimitados",
      "White-label (tu marca, logo y dominio)",
      "Gestión de clientes + facturación",
      "Equivale a su plan de 1.199$ — aquí 39€/mes",
    ],
    stripePriceEnv: "STRIPE_PRICE_AGENCY",
  },
}

/** Orden de tiers de menor a mayor para comparativas y upgrades. */
export const PLAN_ORDER: PlanTier[] = [
  PlanTier.FREE,
  PlanTier.CREATOR,
  PlanTier.AGENT,
  PlanTier.AGENCY,
]

export function getPlan(tier: PlanTier): PlanDefinition {
  return PLANS[tier] ?? PLANS[PlanTier.FREE]
}

export function planForPriceId(priceId: string | null | undefined): PlanTier {
  if (!priceId) return PlanTier.FREE
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceEnv && process.env[plan.stripePriceEnv] === priceId) {
      return plan.tier
    }
  }
  return PlanTier.FREE
}

export function priceIdForTier(tier: PlanTier): string | null {
  const plan = PLANS[tier]
  if (!plan.stripePriceEnv) return null
  return process.env[plan.stripePriceEnv] ?? null
}
