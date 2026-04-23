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
}

/**
 * Organization-based pricing - billing is per organization, not per user.
 * Each tier includes a set number of users, departments, and features.
 * IDs passed to checkout sessions MUST match these IDs.
 * Prices are validated server-side to prevent tampering.
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
    features: [
      "Unlimited users",
      "Everything in Professional",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "On-premise option",
      "Custom branding",
      "Advanced security (SOC 2)",
      "GDPR compliance tools",
      "Bulk data import",
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
