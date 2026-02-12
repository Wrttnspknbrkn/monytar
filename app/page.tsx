"use client"

import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Shield,
  BarChart3,
  Users,
  Zap,
  Building2,
  Wallet,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: FileText,
    title: "Expense Requests",
    description: "Submit, track, and manage expense requests with receipt uploads and automated workflows.",
  },
  {
    icon: CheckCircle2,
    title: "Approval Workflows",
    description: "Multi-level approval chains with manager and finance sign-offs, configurable thresholds.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Dashboard insights with spending trends, budget utilization, and department-level analytics.",
  },
  {
    icon: Shield,
    title: "Budget Controls",
    description: "Set department budgets with automated alerts when spending approaches or exceeds limits.",
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Manage users, roles, and departments with role-based access control across your organization.",
  },
  {
    icon: Zap,
    title: "Instant Processing",
    description: "Auto-approve small expenses under configurable thresholds to reduce administrative overhead.",
  },
]

const steps = [
  { number: "01", title: "Submit", description: "Employees submit expense requests with receipts and supporting details." },
  { number: "02", title: "Approve", description: "Managers review, approve, or reject requests with configurable workflows." },
  { number: "03", title: "Track", description: "Finance teams monitor budgets, process payments, and generate reports." },
]

const tiers = [
  { name: "Free", price: "$0", period: "forever", description: "For small teams getting started", users: "Up to 5 users" },
  { name: "Starter", price: "$29", period: "/month", description: "For growing organizations", users: "Up to 25 users", popular: false },
  { name: "Professional", price: "$99", period: "/month", description: "For established businesses", users: "Unlimited users", popular: true },
  { name: "Enterprise", price: "Custom", period: "", description: "For large organizations", users: "Unlimited + SLA" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Wallet className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">SpendFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Now in Professional Beta
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
            Expense management{" "}
            <br className="hidden sm:block" />
            that just works
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Streamline expense requests, automate approvals, and gain real-time visibility into your
            organization&apos;s spending. From submission to payment in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="px-8">
                Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="px-8 bg-transparent">
                View Demo Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="ml-2 text-xs text-muted-foreground">app.spendflow.io/dashboard</span>
          </div>
          <div className="p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Spent", value: "$24,580", trend: "+12%" },
              { label: "Pending", value: "8", trend: "3 urgent" },
              { label: "Approved", value: "$18,205", trend: "+8.5%" },
              { label: "Budget Used", value: "72%", trend: "On track" },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-lg border border-border bg-background">
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{stat.trend}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Everything you need to manage expenses</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete platform for expense management, from submission to payment reconciliation.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">How SpendFlow works</h2>
            <p className="text-lg text-muted-foreground">Three simple steps to streamline your expense management</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-xl mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Plans and Pricing</h2>
            <p className="text-lg text-muted-foreground">Get started immediately for free. Upgrade as you grow.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={tier.popular ? "border-primary ring-1 ring-primary relative" : "border-border"}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Recommended
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-1">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground text-sm">{tier.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                  <p className="text-sm font-medium mb-6">{tier.users}</p>
                  <Link href="/signup">
                    <Button variant={tier.popular ? "default" : "outline"} className="w-full">
                      {tier.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Building2 className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Ready to take control of your spending?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join organizations that trust SpendFlow to manage their expenses efficiently.
          </p>
          <Link href="/signup">
            <Button size="lg" className="px-8">
              Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-primary">
                <Wallet className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">SpendFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2026 SpendFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
