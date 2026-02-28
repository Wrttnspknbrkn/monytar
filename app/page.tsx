"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Shield,
  BarChart3,
  Users,
  Zap,
  Wallet,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Clock,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"

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
    title: "Smart Expense Requests",
    description: "Submit expenses with intelligent categorization, receipt scanning, and automated compliance checks.",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: CheckCircle2,
    title: "Multi-Level Approvals",
    description: "Configurable approval chains with automatic routing, escalation, and threshold-based auto-approval.",
    gradient: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Interactive dashboards with spending trends, budget utilization, and department-level drill-downs.",
    gradient: "from-violet-500/10 to-purple-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    icon: Shield,
    title: "Budget Controls",
    description: "Department budgets with automated alerts, spending limits, and real-time threshold monitoring.",
    gradient: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Role-based access control with organization hierarchies and department-scoped permissions.",
    gradient: "from-rose-500/10 to-pink-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    icon: Zap,
    title: "Instant Processing",
    description: "Auto-approve small expenses below thresholds, reducing administrative overhead by up to 60%.",
    gradient: "from-sky-500/10 to-blue-500/10",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
]

const metrics = [
  { value: 60, suffix: "%", label: "Time Saved" },
  { value: 50, suffix: "+", label: "Beta Users" },
  { value: 30, suffix: " sec", label: "Avg Submit Time" },
  { value: 2026, suffix: "", label: "Launching" },
]

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For small teams getting started",
    features: ["Up to 5 users", "50 requests/month", "Basic reporting", "Email support"],
  },
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    description: "For growing organizations",
    features: ["Up to 25 users", "Unlimited requests", "Advanced analytics", "Custom workflows", "Priority support"],
  },
  {
    name: "Professional",
    price: "$79",
    period: "/mo",
    description: "For established businesses",
    features: [
      "Unlimited users",
      "Unlimited requests",
      "Custom integrations",
      "Advanced workflows",
      "Budget controls",
      "Dedicated support",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations",
    features: ["Everything in Pro", "SSO & SAML", "Custom SLA", "Dedicated CSM", "On-premise option", "Audit logs"],
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-background/60 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          <Link href="/" className="flex items-center group">
            <Logo size="md" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Pricing</a>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">About</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm font-medium">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="text-sm font-medium shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/30 transition-all">
                Get Started
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-28 md:pt-28 md:pb-36">
          <div className="max-w-3xl mx-auto text-center">
            {/* Pill badge */}
            <div className="animate-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-sm font-medium text-primary mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              Now in early access
              <ChevronRight className="w-3.5 h-3.5" />
            </div>

            <h1 className="animate-in-up-delay-1 font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 text-balance">
              Expense management,{" "}
              <span className="bg-gradient-to-r from-primary via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                reimagined
              </span>
            </h1>

            <p className="animate-in-up-delay-2 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              From submission to reimbursement in minutes, not weeks. Automate approvals, enforce budgets, and gain complete visibility into your spending.
            </p>

            <div className="animate-in-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all">
                  Join Early Access
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold bg-transparent hover:bg-secondary">
                  View Live Demo
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="relative rounded-2xl border border-border/80 bg-card shadow-2xl shadow-foreground/5 overflow-hidden">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>
            <div className="ml-3 flex items-center gap-2 px-3 py-1 rounded-md bg-background/60 border border-border/50">
              <div className="w-3 h-3 rounded-full border-2 border-primary/50" />
              <span className="text-xs text-muted-foreground font-mono">app.spendwell.io/dashboard</span>
            </div>
          </div>

          {/* Dashboard stats */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Spent", value: "$24,580", change: "+12.3%", up: true },
                { label: "Pending", value: "8 requests", change: "3 urgent", up: false },
                { label: "Approved", value: "$18,205", change: "+8.5%", up: true },
                { label: "Budget Used", value: "72%", change: "On track", up: true },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="group relative p-5 rounded-xl border border-border bg-background hover:border-primary/20 transition-all duration-300 hover:shadow-sm"
                >
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{stat.label}</p>
                  <p className="text-2xl font-heading font-bold">{stat.value}</p>
                  <p
                    className={cn(
                      "text-xs font-medium mt-2",
                      stat.up ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {stat.change}
                  </p>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>

            {/* Mini chart area placeholder */}
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 h-40 rounded-xl border border-border bg-background flex items-end justify-between p-6 gap-2">
                {[35, 52, 48, 65, 58, 72, 68, 82, 75, 88, 80, 95].map((h, i) => (
                  <div key={i} className="flex-1 flex items-end">
                    <div
                      className="w-full rounded-t bg-primary/20 hover:bg-primary/40 transition-colors"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="h-40 rounded-xl border border-border bg-background p-5 flex flex-col justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Category</p>
                <div className="flex flex-col gap-2">
                  {[
                    { name: "Software", pct: 38 },
                    { name: "Travel", pct: 28 },
                    { name: "Equipment", pct: 20 },
                  ].map((cat) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary/60" style={{ width: `${cat.pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {cat.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
                  {typeof metric.value === "number" && metric.value % 1 === 0 && metric.value < 100 ? (
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
              A complete platform built for modern teams. From expense submission to financial reporting.
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
              Plans that scale with you
            </h2>
            <p className="text-lg text-muted-foreground">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  "relative flex flex-col p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5",
                  tier.popular
                    ? "border-primary bg-card shadow-xl shadow-primary/10 ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-foreground/[0.03]",
                )}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wide shadow-sm">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-heading font-bold text-lg mb-1">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-heading text-4xl font-extrabold tracking-tight">{tier.price}</span>
                    {tier.period && <span className="text-muted-foreground text-sm">{tier.period}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </div>
                <ul className="flex-1 flex flex-col gap-3 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button
                    variant={tier.popular ? "default" : "outline"}
                    className={cn(
                      "w-full font-semibold",
                      tier.popular && "shadow-sm shadow-primary/25",
                      !tier.popular && "bg-transparent",
                    )}
                  >
                    {tier.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                  </Button>
                </Link>
              </div>
            ))}
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
            Ready to take control?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            Be among the first to experience the future of expense management. Join our early access program today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20">
                Join Early Access
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold bg-transparent">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <div className="mb-4">
                <Logo size="md" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Modern expense management for teams that move fast.</p>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Product</h4>
              <ul className="flex flex-col gap-2.5">
                {[
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Integrations", href: "#integrations" },
                  { label: "Changelog", href: "#changelog" },
                ].map((item) => (
                  <li key={item.label}><a href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Company</h4>
              <ul className="flex flex-col gap-2.5">
                {[
                  { label: "About", href: "/about" },
                  { label: "Contact", href: "/contact" },
                ].map((item) => (
                  <li key={item.label}><Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Legal</h4>
              <ul className="flex flex-col gap-2.5">
                {[
                  { label: "Privacy", href: "/privacy" },
                  { label: "Terms", href: "/terms" },
                  { label: "Security", href: "/security" },
                  { label: "GDPR", href: "/gdpr" },
                ].map((item) => (
                  <li key={item.label}><Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">&copy; 2026 SpendWell. All rights reserved.</p>
            <p className="text-sm text-muted-foreground">Developed by <a href="https://www.gydgen.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors">GydGen</a></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
