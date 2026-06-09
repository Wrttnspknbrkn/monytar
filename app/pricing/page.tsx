"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Minus, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"
import { Reveal } from "@/components/landing/reveal"
import { getProductByTier, type SubscriptionTier } from "@/lib/products"

type BillingInterval = "month" | "year"

interface PlanView {
  tier: SubscriptionTier
  name: string
  description: string
  priceLabel: string
  periodLabel: string
  yearlyNote?: string
  users: string
  features: string[]
  cta: string
  href: string
  popular: boolean
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

function buildPlans(interval: BillingInterval): PlanView[] {
  const tiers: SubscriptionTier[] = ["free", "starter", "professional", "enterprise"]

  return tiers.map((tier) => {
    const product = getProductByTier(tier, interval)!
    const users =
      product.maxUsers === -1 ? "Unlimited users" : `Up to ${product.maxUsers} users`

    if (tier === "free") {
      return {
        tier,
        name: product.name,
        description: product.description,
        priceLabel: "$0",
        periodLabel: "forever",
        users,
        features: product.features,
        cta: "Get started",
        href: "/signup",
        popular: false,
      }
    }

    if (tier === "enterprise") {
      return {
        tier,
        name: product.name,
        description: "For large organizations with custom requirements.",
        priceLabel: "Custom",
        periodLabel: "",
        users,
        features: product.features,
        cta: "Contact sales",
        href: "/contact",
        popular: false,
      }
    }

    const monthlyEquivalent =
      interval === "year" ? Math.round(product.priceInCents / 12) : product.priceInCents

    return {
      tier,
      name: product.name,
      description: product.description,
      priceLabel: formatPrice(monthlyEquivalent),
      periodLabel: "/mo",
      yearlyNote:
        interval === "year"
          ? `${formatPrice(product.priceInCents)} billed yearly`
          : undefined,
      users,
      features: product.features,
      cta: "Start free trial",
      href: `/checkout?plan=${product.id}`,
      popular: !!product.popular,
    }
  })
}

const comparisonFeatures = [
  { name: "Users", free: "5", starter: "25", pro: "100", enterprise: "Unlimited" },
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
    q: "Can I try Monytar before committing?",
    a: "Yes. All paid plans come with a 14-day free trial. No credit card required. You can also use our Free plan indefinitely for up to 5 users.",
  },
  {
    q: "How does the interactive demo work?",
    a: "Click 'Try Interactive Demo' to explore the full platform with sample data. You can switch between roles (Employee, Manager, Finance, Admin) to see how each user type interacts with the system - submit expenses, approve requests, manage budgets, and more. No signup required.",
  },
  {
    q: "How is billing structured?",
    a: "Monytar uses organization-based pricing, not per-user pricing. Each plan includes a set number of users (5, 25, or 100+) for a flat monthly fee. This makes costs predictable as your team grows within your plan limits.",
  },
  {
    q: "Can I upgrade or downgrade at any time?",
    a: "Absolutely. You can change your plan at any time. Upgrades take effect immediately with prorated billing, and downgrades apply at the end of your current billing period.",
  },
  {
    q: "What about enterprise deployment?",
    a: "Enterprise customers can choose between our cloud-hosted solution or an on-premise deployment. We provide full support for custom integrations, SSO/SAML, dedicated infrastructure, and SLA guarantees.",
  },
  {
    q: "Is my data secure?",
    a: "Security is our top priority. We use end-to-end encryption, role-based access control with Row Level Security (RLS), and maintain SOC 2 Type II compliance. All data is encrypted at rest and in transit.",
  },
]

export default function PricingPage() {
  const [interval, setInterval] = useState<BillingInterval>("month")
  const plans = buildPlans(interval)

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      {/* HERO */}
      <section className="relative pt-28 pb-16 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_60%_-10%,rgba(99,102,241,0.3),transparent)]" />
        <div className="absolute inset-0 bg-[url('/images/dot-grid.svg')] opacity-[0.06]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-sm text-primary/90 mb-8 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Organization-based pricing, not per seat
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight mb-6">
            Simple, transparent
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-primary to-cyan-400 bg-clip-text text-transparent">
              pricing
            </span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
            <button
              onClick={() => setInterval("month")}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200",
                interval === "month" ? "bg-white text-slate-900 shadow-sm" : "text-white/60 hover:text-white"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval("year")}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                interval === "year" ? "bg-white text-slate-900 shadow-sm" : "text-white/60 hover:text-white"
              )}
            >
              Yearly
              <span className="rounded-full bg-primary/15 text-primary text-xs font-bold px-2 py-0.5">
                Save 2 months
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="relative -mt-4 pb-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan, i) => (
            <Reveal key={plan.tier} delay={i * 70}>
              <div
                className={cn(
                  "relative h-full rounded-2xl p-7 transition-all duration-300 flex flex-col",
                  plan.popular
                    ? "bg-primary text-white shadow-[0_8px_48px_rgba(99,102,241,0.45)] lg:scale-[1.03] z-10"
                    : "bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-primary text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm border border-primary/10 whitespace-nowrap">
                    Most popular
                  </span>
                )}
                <p
                  className={cn(
                    "text-sm font-bold uppercase tracking-widest mb-1",
                    plan.popular ? "text-white/60" : "text-slate-500"
                  )}
                >
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span
                    className={cn(
                      "font-display text-4xl font-bold",
                      plan.popular ? "text-white" : "text-slate-900"
                    )}
                  >
                    {plan.priceLabel}
                  </span>
                  {plan.periodLabel && (
                    <span className={plan.popular ? "text-white/50" : "text-slate-400"}>
                      {plan.periodLabel}
                    </span>
                  )}
                </div>
                <p className={cn("text-xs h-4 mb-3", plan.popular ? "text-white/55" : "text-slate-400")}>
                  {plan.yearlyNote ?? ""}
                </p>
                <p className={cn("text-sm mb-6", plan.popular ? "text-white/70" : "text-slate-500")}>
                  {plan.description}
                </p>
                <Link
                  href={plan.href}
                  className={cn(
                    "block text-center rounded-xl py-3 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5",
                    plan.popular
                      ? "bg-white text-primary hover:bg-white/90"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  )}
                >
                  {plan.cta}
                  {plan.tier !== "enterprise" && <ArrowRight className="w-3.5 h-3.5" />}
                </Link>
                <ul className="flex flex-col gap-2.5 mt-6">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={cn(
                        "flex items-start gap-2.5 text-sm",
                        plan.popular ? "text-white/85" : "text-slate-600"
                      )}
                    >
                      <Check
                        className={cn(
                          "w-4 h-4 shrink-0 mt-0.5",
                          plan.popular ? "text-white" : "text-primary"
                        )}
                        strokeWidth={2.5}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-12">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-4">
              Compare plans
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Every feature, side by side
            </h2>
          </Reveal>
          <Reveal>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-5 font-semibold text-slate-500">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-900">Free</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-900">Starter</th>
                    <th className="text-center py-4 px-4 font-semibold text-primary">Professional</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row) => (
                    <tr key={row.name} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-slate-700">{row.name}</td>
                      {[row.free, row.starter, row.pro, row.enterprise].map((val, i) => (
                        <td key={i} className="text-center py-3.5 px-4">
                          {typeof val === "boolean" ? (
                            val ? (
                              <Check className="w-4 h-4 text-primary mx-auto" strokeWidth={2.5} />
                            ) : (
                              <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                            )
                          ) : (
                            <span className="text-slate-600">{val}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-12">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-4">
              FAQ
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Frequently asked questions
            </h2>
          </Reveal>
          <div className="flex flex-col gap-6">
            {faqs.map((faq) => (
              <Reveal key={faq.q}>
                <div className="rounded-2xl border border-slate-100 bg-white p-6 hover:border-slate-200 transition-colors">
                  <h3 className="font-display font-bold text-slate-900 mb-2">{faq.q}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 mt-10">
            Still have questions?{" "}
            <Link href="/contact" className="text-primary font-semibold hover:underline underline-offset-2">
              Talk to our team
            </Link>
          </p>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
