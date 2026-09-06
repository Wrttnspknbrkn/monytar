import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  FileText,
  ClipboardList,
  Building2,
  Sparkles,
  LifeBuoy,
  Code2,
  Handshake,
} from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"
import { NewsletterSignup } from "@/components/blog/newsletter-signup"
import { BlogCard } from "@/components/blog/blog-card"
import { Reveal } from "@/components/landing/reveal"
import { getRecentPosts } from "@/lib/blog/posts"

export const metadata: Metadata = {
  title: "Resources | Monytar",
  description:
    "Guides, playbooks, templates, and product updates to help finance teams run spend management well. Everything in one place.",
  openGraph: {
    title: "Monytar Resources",
    description: "Guides, playbooks, templates, and product updates for finance teams.",
    type: "website",
  },
}

const primaryResources = [
  {
    icon: BookOpen,
    title: "Blog",
    description: "Practical writing on spend management, approvals, and finance operations.",
    href: "/blog",
    available: true,
  },
  {
    icon: ClipboardList,
    title: "Finance playbooks",
    description: "Step by step guides for running the close, setting budgets, and scaling a finance team.",
    href: "/resources",
    available: false,
  },
  {
    icon: FileText,
    title: "Expense templates",
    description: "Ready to use policy templates, budget sheets, and approval matrices you can adapt.",
    href: "/resources",
    available: false,
  },
]

const secondaryResources = [
  {
    icon: Building2,
    title: "Case studies",
    description: "How real teams use Monytar to control spend and close faster.",
    href: "/resources",
  },
  {
    icon: Sparkles,
    title: "Product updates",
    description: "What is new in Monytar, shipped and documented.",
    href: "/changelog",
  },
  {
    icon: LifeBuoy,
    title: "Help center",
    description: "Answers to common questions and guides for getting set up.",
    href: "/contact",
  },
  {
    icon: Code2,
    title: "API documentation",
    description: "Build on Monytar. Developer docs are on the way.",
    href: "/resources",
  },
  {
    icon: Handshake,
    title: "Partners",
    description: "Work with us. Implementation partners and integrations.",
    href: "/contact",
  },
  {
    icon: FileText,
    title: "Media kit",
    description: "Logos, brand assets, and company information for press.",
    href: "/about",
  },
]

export default function ResourcesPage() {
  const recentPosts = getRecentPosts(3)

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Header */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-28 pb-14 md:pt-36 md:pb-20">
          <Reveal variant="blur">
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.04] mb-5 text-balance max-w-3xl">
              Everything you need to run spend management well
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Guides, templates, and product updates from the team behind Monytar. Built to help finance teams move faster with more control.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Primary resources */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {primaryResources.map((resource, i) => {
            const Icon = resource.icon
            return (
              <Reveal key={resource.title} variant="grow" delay={i * 80}>
                <Link
                  href={resource.href}
                  className="group relative flex flex-col h-full rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-foreground/[0.03] hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 mb-5">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="font-heading text-lg font-bold">{resource.title}</h2>
                    {!resource.available && (
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{resource.description}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                    {resource.available ? "Explore" : "Coming soon"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* Latest from the blog */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <Reveal variant="rise" className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">From the blog</p>
            <h2 className="font-heading text-2xl font-extrabold tracking-tight">Recent articles</h2>
          </div>
          <Link
            href="/blog"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPosts.map((post, i) => (
            <Reveal key={post.slug} variant="grow" delay={i * 70}>
              <BlogCard post={post} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* More resources */}
      <section className="border-y border-border bg-secondary/20 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal variant="rise">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight mb-8">More from Monytar</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {secondaryResources.map((resource, i) => {
              const Icon = resource.icon
              return (
                <Reveal key={resource.title} variant="rise" delay={i * 40}>
                  <Link
                    href={resource.href}
                    className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/20 hover:shadow-md hover:shadow-foreground/[0.03]"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/5 border border-primary/10 shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-bold mb-1 group-hover:text-primary transition-colors">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{resource.description}</p>
                    </div>
                  </Link>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      <NewsletterSignup />
      <LandingFooter />
    </div>
  )
}
