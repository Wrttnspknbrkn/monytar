"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Shield, Zap, Users, Heart, Target, ChevronRight } from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"
import { Reveal } from "@/components/landing/reveal"

const values = [
  {
    icon: Shield,
    title: "Trust & Transparency",
    description:
      "Every transaction is auditable. We build systems that foster accountability and give finance teams complete visibility.",
  },
  {
    icon: Zap,
    title: "Speed Without Compromise",
    description:
      "Expense approvals should take minutes, not days. We automate what we can and streamline everything else.",
  },
  {
    icon: Users,
    title: "Built for Teams",
    description:
      "From solo founders to enterprise finance departments, Monytar adapts to how your organization actually works.",
  },
  {
    icon: Heart,
    title: "Obsessed with Simplicity",
    description:
      "Complex workflows, simple interfaces. We believe powerful software should feel effortless to use.",
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
    description:
      "Leads strategy and product vision with deep expertise in fintech and enterprise solutions. Passionate about building tools that empower finance teams.",
    image: "/images/team/richmond.png",
  },
  {
    name: "Kelvin Fameyeh",
    role: "Software Developer",
    description:
      "Full-stack engineer driving Monytar's technical architecture and development. Focused on building scalable, performant, and user-friendly software.",
    image: "/images/team/kelvin.png",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      {/* HERO */}
      <section className="relative pt-28 pb-0 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_60%_-10%,rgba(99,102,241,0.3),transparent)]" />
        <div className="absolute inset-0 bg-[url('/images/dot-grid.svg')] opacity-[0.06]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-sm text-primary/90 mb-8 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Our story
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.06] tracking-tight mb-6">
            We believe expense management
            <br />
            should be{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-primary to-cyan-400 bg-clip-text text-transparent">
              effortless
            </span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed pb-16">
            Monytar was built from real-world frustration with outdated expense tools. We set out to
            create something better — and we did.
          </p>
        </div>

        {/* Hero image overlapping the dark/light boundary */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-t-2xl overflow-hidden shadow-[0_-8px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.07)]">
            <Image
              src="/images/about-hero.jpg"
              alt="Abstract visualization of financial growth and data organization"
              width={1200}
              height={500}
              className="w-full h-56 md:h-80 object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="py-24 md:py-28 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <Reveal>
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-5">
              Our mission
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-6 text-balance">
              Giving every team financial clarity and control
            </h2>
            <div className="flex flex-col gap-4 text-slate-500 leading-relaxed">
              <p>
                Managing business expenses has traditionally been a slow, manual, and error-prone
                process. Teams waste hours chasing receipts, navigating confusing approval chains, and
                reconciling spreadsheets at month-end.
              </p>
              <p>
                Monytar solves this. We built a platform that is powerful enough for enterprise finance
                teams yet intuitive enough that any employee can submit an expense in under 60 seconds.
                Our configurable workflows, real-time budget tracking, and comprehensive reporting give
                organizations the visibility they need to make smarter financial decisions.
              </p>
              <p>
                Based in Accra, Ghana, we are on a mission to bring world-class expense management to
                organizations of every size — from startups to large enterprises across Africa and
                beyond.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-100 bg-white p-6 text-center hover:border-primary/20 hover:shadow-md transition-all duration-300"
                >
                  <p className="font-display text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500 mt-1 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-24 md:py-28 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-4">
              Our values
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
              What drives us every day
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((value, i) => {
              const Icon = value.icon
              return (
                <Reveal key={value.title} delay={i * 80}>
                  <div className="group h-full rounded-2xl border border-slate-100 bg-white p-6 hover:border-primary/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/5 border border-primary/10 mb-4 group-hover:bg-primary transition-colors duration-300">
                      <Icon className="w-5 h-5 text-primary group-hover:text-white transition-colors duration-300" strokeWidth={1.75} />
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900 mb-2">{value.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{value.description}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="py-24 md:py-28 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-4">
              Leadership
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              Meet our team
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
              The people behind Monytar — driven by a shared mission to make expense management better
              for everyone.
            </p>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {team.map((member, i) => (
              <Reveal key={member.name} delay={i * 120}>
                <div className="group rounded-2xl border border-slate-100 bg-white hover:border-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                  <div className="relative w-full aspect-[4/5] overflow-hidden bg-slate-100">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={`${member.name} - ${member.role}`}
                      fill
                      className="object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="font-display font-bold text-lg text-slate-900">{member.name}</h3>
                    <p className="text-sm text-primary font-semibold mt-0.5">{member.role}</p>
                    <p className="text-sm text-slate-500 mt-3 leading-relaxed">{member.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-16 md:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 p-8 sm:p-12 md:p-20 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.3),transparent)]" />
            <div className="absolute inset-0 bg-[url('/images/dot-grid.svg')] opacity-[0.06]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 mx-auto mb-6">
              <Target className="w-7 h-7 text-primary" />
            </div>
            <h2 className="relative font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Ready to simplify your expenses?
            </h2>
            <p className="relative text-white/55 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              Join organizations already using Monytar to streamline expense management and gain
              complete financial visibility.
            </p>
            <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="group rounded-full bg-primary text-white font-semibold px-8 py-3.5
                shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_4px_28px_rgba(99,102,241,0.4)]
                hover:shadow-[0_0_0_1px_rgba(99,102,241,0.7),0_4px_40px_rgba(99,102,241,0.55)]
                transition-all duration-300 flex items-center justify-center gap-2"
              >
                Get started free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-white/15 hover:border-white/35 text-white/75 hover:text-white
                font-medium px-8 py-3.5 hover:bg-white/5 transition-all duration-300"
              >
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
