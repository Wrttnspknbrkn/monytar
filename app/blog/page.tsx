import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Clock } from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"
import { BlogIndex } from "@/components/blog/blog-index"
import { NewsletterSignup } from "@/components/blog/newsletter-signup"
import {
  getFeaturedPost,
  getRecentPosts,
  getAllCategories,
  getAuthor,
  formatPostDate,
} from "@/lib/blog/posts"

export const metadata: Metadata = {
  title: "Blog | Monytar",
  description:
    "Practical writing on spend management, finance operations, and building software finance teams trust. From the team behind Monytar.",
  openGraph: {
    title: "Monytar Blog",
    description:
      "Practical writing on spend management, finance operations, and building software finance teams trust.",
    type: "website",
  },
}

export default function BlogPage() {
  const featured = getFeaturedPost()
  const featuredAuthor = getAuthor(featured.authorId)
  const recent = getRecentPosts()
  const categories = getAllCategories()

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Page header */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="relative max-w-7xl mx-auto px-6 pt-28 pb-12 md:pt-32 md:pb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">The Monytar Blog</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] mb-5 text-balance max-w-3xl">
            Ideas on spend, finance, and building a sharper team
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Field notes from the people building Monytar. No fluff, just what we have learned about running finance operations well.
          </p>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <Link
          href={`/blog/${featured.slug}`}
          className="group grid lg:grid-cols-2 gap-8 lg:gap-12 items-center rounded-3xl border border-border bg-card p-5 sm:p-6 lg:p-8 transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-foreground/[0.04]"
        >
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-secondary order-1 lg:order-none">
            <Image
              src={featured.coverImage || "/placeholder.svg"}
              alt={featured.title}
              fill
              priority
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-xs font-semibold text-primary uppercase tracking-wider">
                Featured
              </span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {featured.category}
              </span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-balance mb-4 group-hover:text-primary transition-colors">
              {featured.title}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-6">{featured.excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src={featuredAuthor.avatar || "/placeholder.svg"}
                  alt={featuredAuthor.name}
                  width={36}
                  height={36}
                  className="rounded-full object-cover w-9 h-9"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{featuredAuthor.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPostDate(featured.publishedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{featured.readingMinutes} min read</span>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* All posts with filter */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-heading text-2xl font-extrabold tracking-tight">Latest articles</h2>
          <Link
            href="/resources"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
          >
            Browse resources
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <BlogIndex posts={recent} categories={categories} />
      </section>

      <NewsletterSignup />
      <LandingFooter />
    </div>
  )
}
