"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Shield,
  BarChart3,
  Users,
  Zap,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Clock,
  Star,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"

function AnimatedCounter({ target, prefix = "" }: { target: number; prefix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1200
          const steps = 40
          const increment = target / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              setCount(target)
              clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.3 },
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {count.toLocaleString()}
    </span>
  )
}

const features = [
  {
    icon: FileText,
    title: "Expense Management",
    description: "Submit, track, and manage expense requests with receipt scanning, auto-categorization, and real-time status updates.",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: CheckCircle2,
    title: "Approval Workflows",
    description: "Configurable multi-level approval chains with automatic routing, escalation, and threshold-based auto-approval.",
    gradient: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: BarChart3,
    title: "Reporting & Analytics",
    description: "Interactive dashboards with spending trends, budget utilization, department breakdowns, and exportable reports.",
    gradient: "from-violet-500/10 to-purple-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    icon: Shield,
    title: "Budget Control",
    description: "Department and project-level budgets with automated alerts, spending limits, and real-time threshold monitoring.",
    gradient: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Role-based access control with organization hierarchies, department-scoped permissions, and vendor management.",
    gradient: "from-rose-500/10 to-pink-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    icon: Zap,
    title: "Smart Automation",
    description: "Auto-approve small expenses, detect duplicates, smart categorization, and bulk CSV uploads to save time.",
    gradient: "from-sky-500/10 to-blue-500/10",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
]

const metrics = [
  { value: 60, suffix: "%", label: "Time Saved" },
  { value: 500, suffix: "+", label: "Active Users" },
  { value: 30, suffix: " sec", label: "Avg Submit Time" },
  { value: 99.9, suffix: "%", label: "Uptime" },
]

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For small teams getting started with expense management.",
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
    price: "$19",
    period: "/month",
    description: "For growing teams that need more control and visibility.",
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
    price: "$49",
    period: "/month",
    description: "For mid-size organizations that need advanced features.",
    popular: true,
    features: [
      "Up to 100 users",
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
    features: [
      "Everything in Professional",
      "Unlimited users",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "On-premise option",
      "Custom branding",
      "Advanced security (SOC 2)",
      "24/7 priority support",
    ],
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-28 md:pt-28 md:pb-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="animate-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-sm font-medium text-primary mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              Trusted by finance teams worldwide
              <ChevronRight className="w-3.5 h-3.5" />
            </div>

            <h1 className="animate-in-up-delay-1 font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 text-balance">
              Expense management,{" "}
              <span className="bg-gradient-to-r from-primary via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                reimagined
              </span>
            </h1>

            <p className="animate-in-up-delay-2 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              From submission to reimbursement in minutes, not weeks. Automate approvals, enforce budgets, and gain complete visibility into your organization{"'"}s spending.
            </p>

            <div className="animate-in-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold bg-transparent hover:bg-secondary">
                  Try Interactive Demo
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Image */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="relative rounded-2xl border border-border/80 bg-card shadow-2xl shadow-foreground/5 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>
            <div className="ml-3 flex items-center gap-2 px-3 py-1 rounded-md bg-background/60 border border-border/50">
              <div className="w-3 h-3 rounded-full border-2 border-primary/50" />
              <span className="text-xs text-muted-foreground font-mono">app.monytar.com/dashboard</span>
            </div>
          </div>
          <div className="relative w-full aspect-[16/9]">
            <Image
              src="/images/dashboard-preview.png"
              alt="Monytar expense management dashboard showing real-time analytics, spending trends, and approval workflows"
              fill
              className="object-cover object-left-top"
              priority
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {metrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <p className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight">
                  {typeof metric.value === "number" && metric.value < 100 ? (
                    <AnimatedCounter target={metric.value} />
                  ) : (
                    metric.value
                  )}
                  <span className="text-primary">{metric.suffix}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1 font-medium">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Features</p>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-balance">
              Everything your finance team needs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A complete platform built for modern teams. From expense submission to financial reporting, all in one place.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group relative p-6 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-foreground/[0.03] hover:-translate-y-0.5"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br mb-4",
                      feature.gradient,
                    )}
                  >
                    <Icon className={cn("w-5 h-5", feature.iconColor)} />
                  </div>
                  <h3 className="font-heading text-base font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
          <div className="text-center mt-10">
            <Link href="/features">
              <Button variant="outline" size="lg" className="font-semibold bg-transparent">
                See All Features <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 md:py-32 bg-secondary/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">How it Works</p>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-balance">
              Three steps to streamlined expenses
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: "01",
                icon: FileText,
                title: "Submit",
                description:
                  "Employees submit expense requests with receipts, vendor details, and business justification. Auto-categorization saves time.",
              },
              {
                step: "02",
                icon: Clock,
                title: "Approve",
                description:
                  "Smart routing sends requests to the right approvers. Managers review, comment, and approve or reject with one click.",
              },
              {
                step: "03",
                icon: BarChart3,
                title: "Track & Pay",
                description:
                  "Finance teams monitor budgets in real-time, process payments, and generate comprehensive reports for auditing.",
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="relative text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border shadow-sm mb-6 group-hover:border-primary/30 group-hover:shadow-md transition-all duration-300">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 md:right-auto md:left-1/2 md:ml-6 md:-top-1 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm">
                    {item.step}
                  </div>
                  <h3 className="font-heading text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-balance">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground">Start free and scale as you grow. No hidden fees, no surprises.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5",
                  plan.popular
                    ? "border-primary bg-card shadow-xl shadow-primary/10 ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-foreground/[0.03]",
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wide shadow-sm">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-heading font-bold text-lg mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-heading text-4xl font-extrabold tracking-tight">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <ul className="flex-1 flex flex-col gap-2.5 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.name === "Enterprise" ? "/contact" : plan.name === "Free" ? "/signup" : `/checkout?plan=${plan.name.toLowerCase()}-monthly`}>
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className={cn(
                      "w-full font-semibold",
                      plan.popular && "shadow-sm shadow-primary/25",
                      !plan.popular && "bg-transparent",
                    )}
                  >
                    {plan.name === "Enterprise" ? "Contact Sales" : plan.name === "Free" ? "Get Started" : "Start Free Trial"}
                    {plan.name !== "Enterprise" && <ArrowRight className="w-3.5 h-3.5 ml-1.5" />}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/pricing" className="text-sm text-primary font-medium hover:underline">
              View full feature comparison <ArrowRight className="w-3 h-3 inline ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 bg-secondary/30 border-y border-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-6">
            <Star className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-5 text-balance">
            Ready to take control of your expenses?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            Join hundreds of teams already using Monytar to streamline their expense management and gain financial clarity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold bg-transparent">
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
