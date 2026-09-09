export type SubscriptionTier = "free" | "starter" | "professional" | "enterprise"

export interface Product {
  id: string
  name: string
  tier: SubscriptionTier
  description: string
  priceInCents: number
  interval: "month" | "year"
  features: string[]
  popular?: boolean
  maxUsers: number
  maxDepartments: number
  maxRequestsPerMonth: number | null // null = unlimited
  stripeProductId: string | null // prod_... — groups this tier's prices in Stripe
  stripePriceId: string | null // price_... — what checkout actually charges. null = no Stripe checkout for this row (e.g. Enterprise)
}

/**
 * Organization-based pricing - billing is per organization, not per user.
 * Each tier includes a set number of users, departments, and features.
 * IDs passed to checkout sessions MUST match these IDs.
 * Prices are validated server-side to prevent tampering.
 *
 * Stripe IDs below were created 2026-08-25. Starter and Professional each
 * share ONE Stripe Product across their monthly/yearly rows (a Product can
 * hold multiple recurring Prices) — only the Price ID differs per interval.
 */
export const PRODUCTS: Product[] = [
  {
    id: "free",
    name: "Free",
    tier: "free",
    description: "For small teams getting started with expense management",
    priceInCents: 0,
    interval: "month",
    maxUsers: 3,
    maxDepartments: 1,
    maxRequestsPerMonth: 50,
    stripeProductId: "prod_V8da1ptl7gI06l",
    stripePriceId: "price_1U8MIsDgVNvX3fxySWc0l2HG",
    features: [
      "Up to 3 users",
      "50 expense requests/month",
      "Basic approval workflow",
      "Standard reporting",
      "Email support",
      "1 department",
    ],
  },
  {
    id: "starter-monthly",
    name: "Starter",
    tier: "starter",
    description: "For growing teams that need more control and visibility",
    priceInCents: 2900, // $29/month per organization
    interval: "month",
    maxUsers: 10,
    maxDepartments: 5,
    maxRequestsPerMonth: null, // unlimited
    stripeProductId: "prod_V8dbNcainvnP3Y",
    stripePriceId: "price_1U8MMwDgVNvX3fxydh4cGKeR",
    features: [
      "Up to 10 users",
      "Unlimited expense requests",
      "Multi-level approvals",
      "Multi-currency reporting, 16 currencies",
      "CSV & printable report exports",
      "Custom expense categories",
      "5 departments",
      "Priority email support",
      "Vendor management",
    ],
  },
  {
    id: "starter-yearly",
    name: "Starter",
    tier: "starter",
    description: "For growing teams that need more control and visibility",
    priceInCents: 29000, // $290/year (2 months free)
    interval: "year",
    maxUsers: 10,
    maxDepartments: 5,
    maxRequestsPerMonth: null,
    stripeProductId: "prod_V8dbNcainvnP3Y",
    stripePriceId: "price_1U8MPCDgVNvX3fxya277YrS2",
    features: [
      "Up to 10 users",
      "Unlimited expense requests",
      "Multi-level approvals",
      "Multi-currency reporting, 16 currencies",
      "CSV & printable report exports",
      "Custom expense categories",
      "5 departments",
      "Priority email support",
      "Vendor management",
    ],
  },
  {
    id: "professional-monthly",
    name: "Professional",
    tier: "professional",
    description: "For mid-size organizations that need advanced features",
    priceInCents: 6900, // $69/month per organization
    interval: "month",
    popular: true,
    maxUsers: 50,
    maxDepartments: -1, // unlimited
    maxRequestsPerMonth: null,
    stripeProductId: "prod_V8diuzoJbw5gdq",
    stripePriceId: "price_1U8MR6DgVNvX3fxymY7292Ka",
    features: [
      "Up to 50 users",
      "Unlimited expense requests",
      "Unlimited departments",
      "Advanced approval chains",
      "Budget management & overage alerts",
      "Full request & approval history",
      "Phone & priority email support",
    ],
  },
  {
    id: "professional-yearly",
    name: "Professional",
    tier: "professional",
    description: "For mid-size organizations that need advanced features",
    priceInCents: 69000, // $690/year (2 months free)
    interval: "year",
    popular: true,
    maxUsers: 50,
    maxDepartments: -1,
    maxRequestsPerMonth: null,
    stripeProductId: "prod_V8diuzoJbw5gdq",
    stripePriceId: "price_1U8MRWDgVNvX3fxyuL9pB1JE",
    features: [
      "Up to 50 users",
      "Unlimited expense requests",
      "Unlimited departments",
      "Advanced approval chains",
      "Budget management & overage alerts",
      "Full request & approval history",
      "Phone & priority email support",
    ],
  },
  {
    id: "enterprise-monthly",
    name: "Enterprise",
    tier: "enterprise",
    description: "For large organizations that need unlimited seats and hands-on onboarding",
    priceInCents: 19900, // $199/month, flat — unlimited seats. Still routed to Contact Sales
    // rather than self-serve Stripe Checkout: onboarding/integration work at this scale is
    // scoped per customer. See createCheckoutSession's explicit tier === "enterprise" guard.
    interval: "month",
    maxUsers: -1, // unlimited
    maxDepartments: -1,
    maxRequestsPerMonth: null,
    stripeProductId: "prod_V8dmUjz4zS8XEA",
    stripePriceId: null, // no self-serve checkout — routes to Contact Sales
    features: [
      "Unlimited users",
      "Everything in Professional",
      "One licence, no per-user add-on pricing",
      "Dedicated onboarding & training",
      "Custom integrations, scoped & built to order",
      "Named contact & response-time SLA",
    ],
  },
]

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

export function getProductByTier(tier: SubscriptionTier, interval: "month" | "year" = "month"): Product | undefined {
  if (tier === "free") return PRODUCTS.find((p) => p.id === "free")
  if (tier === "enterprise") return PRODUCTS.find((p) => p.id === "enterprise-monthly")
  return PRODUCTS.find((p) => p.tier === tier && p.interval === interval)
}

/**
 * Resolves a PRODUCTS entry from a Stripe Price ID. This is the authoritative
 * lookup for checkout/webhook handlers — Stripe events carry a price ID, and
 * this maps it straight back to the internal product row (id, tier, limits).
 */
export function getProductByStripePriceId(stripePriceId?: string | null): Product | undefined {
  if (!stripePriceId) return undefined
  return PRODUCTS.find((p) => p.stripePriceId === stripePriceId)
}

/**
 * Resolves a subscription tier from a Stripe product_id (authoritative) with a
 * price-amount fallback. NEVER returns an invalid tier — the database CHECK only
 * permits 'free' | 'starter' | 'professional' | 'enterprise'.
 */
export function getTierFromProductId(productId?: string | null): SubscriptionTier | null {
  if (!productId) return null
  const product = getProductById(productId)
  return product ? product.tier : null
}

/**
 * Resolves a subscription tier from a Stripe Price ID (authoritative). Prefer
 * this over getTierFromProductId in webhook handlers, since Stripe subscription
 * events key off price IDs, not the internal PRODUCTS[].id values.
 */
export function getTierFromStripePriceId(stripePriceId?: string | null): SubscriptionTier | null {
  const product = getProductByStripePriceId(stripePriceId)
  return product ? product.tier : null
}

export function getTierFromPriceAmount(priceAmount: number): SubscriptionTier {
  // Prefer an exact match against a known product price (handles monthly + yearly).
  const exact = PRODUCTS.find((p) => p.priceInCents === priceAmount && p.priceInCents > 0)
  if (exact) return exact.tier
  // Heuristic fallback — always a valid tier, never "business".
  if (priceAmount <= 0) return "free"
  if (priceAmount <= 2900) return "starter" // starter monthly
  if (priceAmount <= 6900) return "professional" // professional monthly
  if (priceAmount <= 29000) return "starter" // starter yearly
  if (priceAmount <= 69000) return "professional" // professional yearly
  return "enterprise"
}

/**
 * `maxUsers`/`maxDepartments` use -1 to mean "unlimited" (matches the Product
 * type's convention). Normalizes that sentinel to Infinity so callers can do
 * plain numeric comparisons (e.g. `count >= limit`) without special-casing -1,
 * which would otherwise make every comparison against it true.
 */
export function normalizeLimit(limit: number): number {
  return limit === -1 ? Infinity : limit
}

export function resolveSubscriptionTier(opts: { productId?: string | null; priceAmount?: number }): SubscriptionTier {
  return getTierFromProductId(opts.productId) ?? getTierFromPriceAmount(opts.priceAmount ?? 0)
}

export function getTierLimits(tier: SubscriptionTier): { maxUsers: number; maxDepartments: number; maxRequestsPerMonth: number | null } {
  const product = getProductByTier(tier)
  if (!product) {
    // Default to free tier limits
    return { maxUsers: 3, maxDepartments: 1, maxRequestsPerMonth: 50 }
  }
  return {
    maxUsers: product.maxUsers,
    maxDepartments: product.maxDepartments,
    maxRequestsPerMonth: product.maxRequestsPerMonth,
  }
}
