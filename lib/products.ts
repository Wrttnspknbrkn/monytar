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
    maxUsers: 5,
    maxDepartments: 1,
    maxRequestsPerMonth: 50,
    stripeProductId: "prod_V8da1ptl7gI06l",
    stripePriceId: "price_1U8MIsDgVNvX3fxySWc0l2HG",
    features: [
      "Up to 5 users",
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
    priceInCents: 1900, // $19/month per organization
    interval: "month",
    maxUsers: 25,
    maxDepartments: 5,
    maxRequestsPerMonth: null, // unlimited
    stripeProductId: "prod_V8dbNcainvnP3Y",
    stripePriceId: "price_1U8MMwDgVNvX3fxydh4cGKeR",
    features: [
      "Up to 25 users",
      "Unlimited expense requests",
      "Multi-level approvals",
      "Custom categories",
      "CSV export",
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
    priceInCents: 19000, // $190/year (2 months free)
    interval: "year",
    maxUsers: 25,
    maxDepartments: 5,
    maxRequestsPerMonth: null,
    stripeProductId: "prod_V8dbNcainvnP3Y",
    stripePriceId: "price_1U8MPCDgVNvX3fxya277YrS2",
    features: [
      "Up to 25 users",
      "Unlimited expense requests",
      "Multi-level approvals",
      "Custom categories",
      "CSV export",
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
    priceInCents: 4900, // $49/month per organization
    interval: "month",
    popular: true,
    maxUsers: 100,
    maxDepartments: -1, // unlimited
    maxRequestsPerMonth: null,
    stripeProductId: "prod_V8diuzoJbw5gdq",
    stripePriceId: "price_1U8MR6DgVNvX3fxymY7292Ka",
    features: [
      "Up to 100 users",
      "Unlimited expense requests",
      "Advanced approval chains",
      "Budget management",
      "Advanced analytics",
      "Unlimited departments",
      "API access",
      "SSO integration",
      "Custom roles",
      "Audit trail",
      "Phone & email support",
    ],
  },
  {
    id: "professional-yearly",
    name: "Professional",
    tier: "professional",
    description: "For mid-size organizations that need advanced features",
    priceInCents: 49000, // $490/year (2 months free)
    interval: "year",
    popular: true,
    maxUsers: 100,
    maxDepartments: -1,
    maxRequestsPerMonth: null,
    stripeProductId: "prod_V8diuzoJbw5gdq",
    stripePriceId: "price_1U8MRWDgVNvX3fxyuL9pB1JE",
    features: [
      "Up to 100 users",
      "Unlimited expense requests",
      "Advanced approval chains",
      "Budget management",
      "Advanced analytics",
      "Unlimited departments",
      "API access",
      "SSO integration",
      "Custom roles",
      "Audit trail",
      "Phone & email support",
    ],
  },
  {
    id: "enterprise-monthly",
    name: "Enterprise",
    tier: "enterprise",
    description: "Custom deployment for large organizations",
    priceInCents: 0, // Custom pricing - contact sales
    interval: "month",
    maxUsers: -1, // unlimited
    maxDepartments: -1,
    maxRequestsPerMonth: null,
    stripeProductId: "prod_V8dmUjz4zS8XEA",
    stripePriceId: null, // no fixed price — route to a "contact sales" flow, not Stripe Checkout
    features: [
      "Unlimited users",
      "Everything in Professional",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "On-premise option",
      "Custom branding",
      "Advanced security controls",
      "Data retention & audit tools",
      "Assisted data import",
      "Training & onboarding",
      "24/7 priority support",
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
  if (priceAmount <= 1900) return "starter"
  if (priceAmount <= 4900) return "professional"
  if (priceAmount <= 49000) return "professional"
  return "enterprise"
}

export function resolveSubscriptionTier(opts: { productId?: string | null; priceAmount?: number }): SubscriptionTier {
  return getTierFromProductId(opts.productId) ?? getTierFromPriceAmount(opts.priceAmount ?? 0)
}

export function getTierLimits(tier: SubscriptionTier): { maxUsers: number; maxDepartments: number; maxRequestsPerMonth: number | null } {
  const product = getProductByTier(tier)
  if (!product) {
    // Default to free tier limits
    return { maxUsers: 5, maxDepartments: 1, maxRequestsPerMonth: 50 }
  }
  return {
    maxUsers: product.maxUsers,
    maxDepartments: product.maxDepartments,
    maxRequestsPerMonth: product.maxRequestsPerMonth,
  }
}
