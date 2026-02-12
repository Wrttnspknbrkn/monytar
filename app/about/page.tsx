"use client"

import Link from "next/link"
import {
  Wallet,
  ArrowRight,
  Shield,
  Zap,
  Users,
  Target,
  Globe,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const values = [
  {
    icon: Shield,
    title: "Trust & Transparency",
    description: "Every transaction is auditable. We build systems that foster accountability and give finance teams complete visibility.",
  },
  {
    icon: Zap,
    title: "Speed Without Compromise",
    description: "Expense approvals should take minutes, not days. We automate what we can and streamline everything else.",
  },
  {
    icon: Users,
    title: "Built for Teams",
    description: "From solo founders to enterprise finance departments, SpendFlow adapts to how your organization actually works.",
  },
  {
    icon: Heart,
    title: "Obsessed with Simplicity",
    description: "Complex workflows, simple interfaces. We believe powerful software should feel effortless to use.",
  },
]

const stats = [
  { label: "Founded", value: "2024" },
  { label: "Team Members", value: "42" },
  { label: "Organizations Served", value: "250+" },
  { label: "Countries", value: "18" },
]

const team = [
  { name: "Amara Osei", role: "CEO & Co-Founder", description: "Former CFO at a Series C fintech. Experienced the expense pain firsthand." },
  { name: "Liam Nakamura", role: "CTO & Co-Founder", description: "Previously infrastructure lead at a top payments company. Systems thinker." },
  { name: "Sofia Reyes", role: "VP of Product", description: "10+ years designing financial tools. Passionate about making complex things simple." },
  { name: "Raj Patel", role: "VP of Engineering", description: "Scaled engineering teams from 5 to 100. Believes in shipping fast and iterating." },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shadow-sm shadow-primary/25 transition-shadow group-hover:shadow-md group-hover:shadow-primary/30">
              <Wallet className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-heading font-bold tracking-tight">SpendFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Features</Link>
            <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Pricing</Link>
            <Link href="/about" className="text-sm text-foreground font-medium transition-colors duration-200">About</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm font-medium">Log in</Button>
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-sm font-medium text-primary mb-8">
            <Globe className="w-3.5 h-3.5" />
            Our Story
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6 text-balance">
            We believe expense management should be{" "}
            <span className="bg-gradient-to-r from-primary via-blue-600 to-cyan-500 bg-clip-text text-transparent">effortless</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            SpendFlow was born from a simple frustration: managing business expenses was unnecessarily painful.
            We set out to change that.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Our Mission</p>
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight mb-6 text-balance">
              Giving every team financial clarity and control
            </h2>
            <div className="flex flex-col gap-4 text-muted-foreground leading-relaxed">
              <p>
                In 2024, our founders were running a growing company and realized they were spending more time
                chasing expense receipts and approval signatures than actually growing the business.
              </p>
              <p>
                Existing tools were either too complex for small teams or too simple for scaling organizations.
                SpendFlow fills that gap - powerful enough for enterprise finance teams,
                intuitive enough that any employee can submit an expense in under 30 seconds.
              </p>
              <p>
                Today, we serve over 250 organizations across 18 countries, processing millions in expense
                requests every month. And we are just getting started.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="p-6 rounded-2xl border border-border bg-card text-center hover:border-primary/20 transition-all duration-300 hover:shadow-md hover:shadow-foreground/[0.03]">
                <p className="font-heading text-3xl font-extrabold tracking-tight text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-secondary/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Our Values</p>
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-balance">
              What drives us every day
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((value) => {
              const Icon = value.icon
              return (
                <div key={value.title} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-foreground/[0.03] hover:-translate-y-0.5">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/5 border border-primary/10 mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-heading text-base font-bold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Leadership</p>
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-balance">
              Meet the team behind SpendFlow
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A diverse group of builders, operators, and finance professionals united by a mission to make expense management better.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {team.map((member) => (
              <div key={member.name} className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-foreground/[0.03] hover:-translate-y-0.5 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/5 border border-primary/10 mx-auto mb-4">
                  <span className="text-xl font-bold text-primary">
                    {member.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-base">{member.name}</h3>
                <p className="text-sm text-primary font-medium mt-0.5">{member.role}</p>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-secondary/30 border-y border-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-6">
            <Target className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight mb-5 text-balance">
            Ready to simplify your expenses?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            Join the hundreds of teams already saving time and money with SpendFlow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold bg-transparent">
                Contact Sales
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
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shadow-sm shadow-primary/25">
                  <Wallet className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-heading font-bold tracking-tight">SpendFlow</span>
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
            <p className="text-sm text-muted-foreground">&copy; 2026 SpendFlow. All rights reserved.</p>
            <p className="text-sm text-muted-foreground">Developed by <a href="https://www.gydgen.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors">GydGen</a></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
