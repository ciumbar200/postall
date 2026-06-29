import Stripe from "stripe"

let cached: Stripe | null = null

export function hasStripeEnv() {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured (missing STRIPE_SECRET_KEY).")
  }
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return cached
}
