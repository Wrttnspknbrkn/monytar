export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  interval: "month" | "year"
  features: string[]
  popular?: boolean
  maxUsers?: number
}

/**
 * Source of truth for all subscription plans.
 * IDs passed to checkout sessions MUST match these IDs.
 * Prices are validated server-side to prevent tampering.
 */
export const PRODUCTS: Product[] = [
  {
    id: "starter-monthly",
    name: "Starter",
    description: "For small teams getting started with expense management",
    priceInCents: 2900,
    interval: "month",
    maxUsers: 10,
    features: [
      "Up to 10 users",
      "Basic expense tracking",
      "Manual approvals",
      "Email notifications",
      "Basic reporting",
      "CSV export",
    ],
  },
  {
    id: "professional-monthly",
    name: "Professional",
    description: "For growing teams that need automation and control",
    priceInCents: 7900,
    interval: "month",
    popular: true,
    maxUsers: 50,
    features: [
      "Up to 50 users",
      "Automated approval workflows",
      "Budget tracking per department",
      "Vendor management",
      "Advanced reporting & analytics",
      "Multi-currency support",
      "Receipt OCR scanning",
      "Priority email support",
    ],
  },
  {
    id: "business-monthly",
    name: "Business",
    description: "For organizations that need full visibility and control",
    priceInCents: 19900,
    interval: "month",
    maxUsers: 200,
    features: [
      "Up to 200 users",
      "Everything in Professional",
      "Custom approval chains",
      "Role-based access control",
      "API access",
      "Audit trail",
      "SSO / SAML integration",
      "Dedicated account manager",
    ],
  },
  {
    id: "enterprise-monthly",
    name: "Enterprise",
    description: "Custom deployment for large organizations",
    priceInCents: 0, // Custom pricing - contact sales
    interval: "month",
    features: [
      "Unlimited users",
      "Everything in Business",
      "On-premise deployment option",
      "Custom integrations",
      "SLA guarantee",
      "24/7 phone support",
      "Dedicated infrastructure",
      "Custom training & onboarding",
    ],
  },
]

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}
