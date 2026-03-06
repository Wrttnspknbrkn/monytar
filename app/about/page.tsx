"use client"

import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Shield,
  Zap,
  Users,
  Heart,
  Target,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"

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
    description: "From solo founders to enterprise finance departments, Monytar adapts to how your organization actually works.",
  },
  {
    icon: Heart,
    title: "Obsessed with Simplicity",
    description: "Complex workflows, simple interfaces. We believe powerful software should feel effortless to use.",
  },
]

const stats = [
  { label: "Founded", value: "2025" },
  { label: "Headquarters", value: "Accra" },
  { label: "Platform Status", value: "Live" },
  { label: "Vision", value: "Global" },
]

const team = [
  {
    name: "Richmond Asare",
    role: "Team Lead",
    description: "Leads strategy and product vision with deep expertise in fintech and enterprise solutions. Passionate about building tools that empower finance teams.",
    image: "/images/team/richmond.png",
  },
  {
    name: "Kelvin Fameyeh",
    role: "Software Developer",
    description: "Full-stack engineer driving Monytar's technical architecture and development. Focused on building scalable, performant, and user-friendly software.",
    image: "/images/team/kelvin.png",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

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
            Monytar was built from real-world frustration with outdated expense tools. We set out to create something better -- and we did.
          </p>
        </div>
      </section>

      {/* About Image - Abstract finance/growth concept */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl shadow-foreground/5">
          <Image
            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop&q=80"
            alt="Abstract visualization of financial growth and data organization"
            width={1200}
            height={600}
            className="w-full h-64 md:h-96 object-cover"
            priority
            unoptimized
          />
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
                Managing business expenses has traditionally been a slow, manual, and error-prone process. Teams waste hours chasing receipts, navigating confusing approval chains, and reconciling spreadsheets at month-end.
              </p>
              <p>
                Monytar solves this. We built a platform that is powerful enough for enterprise finance teams yet intuitive enough that any employee can submit an expense in under 30 seconds. Our configurable workflows, real-time budget tracking, and comprehensive reporting give organizations the visibility they need to make smarter financial decisions.
              </p>
              <p>
                Based in Accra, Ghana, we are on a mission to bring world-class expense management to organizations of every size -- from startups to large enterprises across Africa and beyond.
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
              Meet our team
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The people behind Monytar -- driven by a shared mission to make expense management better for everyone.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {team.map((member) => (
              <div key={member.name} className="group rounded-2xl border border-border bg-card hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-foreground/[0.03] hover:-translate-y-0.5 overflow-hidden">
                <div className="relative w-full aspect-[4/5] overflow-hidden">
                  <Image
                    src={member.image}
                    alt={`${member.name} - ${member.role}`}
                    fill
                    className="object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="font-heading font-bold text-lg">{member.name}</h3>
                  <p className="text-sm text-primary font-semibold mt-0.5">{member.role}</p>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{member.description}</p>
                </div>
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
            Join organizations already using Monytar to streamline expense management and gain complete financial visibility.
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
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
