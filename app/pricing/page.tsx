import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Check, Minus, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "SpendWell pricing plans: Free for small teams, Starter for growing businesses, Professional for mid-market, and Enterprise for large organizations.",
}

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For small teams getting started with expense management.",
    cta: "Get Started",
    ctaVariant: "outline" as const,
    popular: false,
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
    name: "Starter",
    price: "$29",
    period: "/user/month",
    description: "For growing teams that need more control and visibility.",
    cta: "Start Free Trial",
    ctaVariant: "outline" as const,
    popular: false,
    features: [
      "Up to 25 users",
      "Unlimited requests",
      "Multi-level approvals",
      "Custom categories",
      "CSV export",
      "5 departments",
      "Priority email support",
      "Vendor management",
    ],
  },
  {
    name: "Professional",
    price: "$99",
    period: "/user/month",
    description: "For mid-size organizations that need advanced features.",
    cta: "Start Free Trial",
    ctaVariant: "default" as const,
    popular: true,
    features: [
      "Unlimited users",
      "Unlimited requests",
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
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations with custom requirements.",
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
    popular: false,
    features: [
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

const comparisonFeatures = [
  { name: "Users", free: "5", starter: "25", pro: "Unlimited", enterprise: "Unlimited" },
  { name: "Expense Requests", free: "50/mo", starter: "Unlimited", pro: "Unlimited", enterprise: "Unlimited" },
  { name: "Departments", free: "1", starter: "5", pro: "Unlimited", enterprise: "Unlimited" },
  { name: "Approval Workflows", free: "Basic", starter: "Multi-level", pro: "Advanced", enterprise: "Custom" },
  { name: "Budget Management", free: false, starter: false, pro: true, enterprise: true },
  { name: "Vendor Management", free: false, starter: true, pro: true, enterprise: true },
  { name: "Advanced Analytics", free: false, starter: false, pro: true, enterprise: true },
  { name: "API Access", free: false, starter: false, pro: true, enterprise: true },
  { name: "SSO / SAML", free: false, starter: false, pro: true, enterprise: true },
  { name: "Audit Trail", free: false, starter: false, pro: true, enterprise: true },
  { name: "Custom Branding", free: false, starter: false, pro: false, enterprise: true },
  { name: "On-Premise Deploy", free: false, starter: false, pro: false, enterprise: true },
  { name: "SLA Guarantee", free: false, starter: false, pro: false, enterprise: true },
]

const faqs = [
  {
    q: "Can I try SpendWell before committing?",
    a: "Yes. All paid plans come with a 14-day free trial. No credit card required. You can also use our Free plan indefinitely for up to 5 users.",
  },
  {
    q: "How does the demo mode work?",
    a: "When you sign up, you can explore the full platform with sample data. Switch between roles (employee, manager, finance, admin) to see how different users interact with the system. When ready, connect your database to go live.",
  },
  {
    q: "Can I upgrade or downgrade at any time?",
    a: "Absolutely. You can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the end of your current billing period.",
  },
  {
    q: "What about enterprise deployment?",
    a: "Enterprise customers can choose between our cloud-hosted solution or an on-premise deployment. We provide full support for custom integrations, SSO, and dedicated infrastructure.",
  },
  {
    q: "Is my data secure?",
    a: "Security is our top priority. We use end-to-end encryption, role-based access control, and maintain SOC 2 Type II compliance. All data is encrypted at rest and in transit.",
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <Link href="/" className="flex items-center group">
            <Logo size="md" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm font-semibold text-primary">Pricing</Link>
            <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-semibold">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="font-semibold shadow-sm shadow-primary/25">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight text-balance">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mt-4 max-w-2xl mx-auto text-pretty">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "relative border-border/60 transition-all duration-300 hover:shadow-md",
                plan.popular && "border-primary shadow-lg shadow-primary/10 scale-[1.02]",
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  Most Popular
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg font-bold">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="font-heading text-4xl font-extrabold">{plan.price}</span>
                  {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent className="pt-4">
                <Link href={plan.name === "Enterprise" ? "/contact" : "/signup"}>
                  <Button
                    variant={plan.ctaVariant}
                    className={cn("w-full font-semibold", plan.popular && "shadow-sm shadow-primary/25")}
                  >
                    {plan.cta}
                    {plan.name !== "Enterprise" && <ArrowRight className="w-3.5 h-3.5 ml-1.5" />}
                  </Button>
                </Link>
                <ul className="flex flex-col gap-2.5 mt-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-2xl font-extrabold tracking-tight text-center mb-10">Feature comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold">Free</th>
                  <th className="text-center py-3 px-4 font-semibold">Starter</th>
                  <th className="text-center py-3 px-4 font-semibold text-primary">Professional</th>
                  <th className="text-center py-3 px-4 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row) => (
                  <tr key={row.name} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{row.name}</td>
                    {[row.free, row.starter, row.pro, row.enterprise].map((val, i) => (
                      <td key={i} className="text-center py-3 px-4">
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <Minus className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                          )
                        ) : (
                          <span className="text-muted-foreground">{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-2xl font-extrabold tracking-tight text-center mb-10">Frequently asked questions</h2>
          <div className="flex flex-col gap-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-border/40 pb-6 last:border-0">
                <h3 className="font-heading font-bold text-sm mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/20 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground">&copy; 2026 SpendWell. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
