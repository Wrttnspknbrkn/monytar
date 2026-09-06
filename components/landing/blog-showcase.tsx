"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Clock, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Reveal } from "@/components/landing/reveal"
import {
  getAllPosts,
  getFeaturedPost,
  getAuthor,
  formatPostDate,
  type BlogCategory,
} from "@/lib/blog/posts"

const FILTERS: ("All" | BlogCategory)[] = [
  "All",
  "Spend Management",
  "Finance Operations",
  "Product",
  "Engineering",
]

export function BlogShowcase() {
  const [active, setActive] = useState<"All" | BlogCategory>("All")
  const featured = getFeaturedPost()
  const featuredAuthor = getAuthor(featured.authorId)

  const posts = useMemo(() => {
    const all = getAllPosts().filter((p) => p.slug !== featured.slug)
    const filtered = active === "All" ? all : all.filter((p) => p.category === active)
    return filtered.slice(0, 4)
  }, [active, featured.slug])

  return (
    <section className="py-24 md:py-32 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <Reveal className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-3">
              Ideas for modern finance teams
            </h2>
            <p className="text-slate-500 text-lg max-w-xl leading-relaxed">
              Playbooks, product updates, and lessons on running a tighter, faster finance operation.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-primary font-semibold text-sm group shrink-0"
          >
            View all articles
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" strokeWidth={2} />
          </Link>
        </Reveal>

        {/* Category filter pills */}
        <Reveal className="flex flex-wrap gap-2 mb-10">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActive(filter)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                active === filter
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {filter}
            </button>
          ))}
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Featured post */}
          <Reveal>
            <Link
              href={`/blog/${featured.slug}`}
              className="group flex flex-col h-full rounded-2xl border border-slate-100 bg-white overflow-hidden hover:border-primary/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <Image
                  src={featured.coverImage || "/placeholder.svg"}
                  alt={featured.title}
                  fill
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <span className="absolute top-4 left-4 rounded-full bg-white/95 backdrop-blur px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-sm">
                  Featured
                </span>
              </div>
              <div className="flex flex-col flex-1 p-6">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                  {featured.category}
                </span>
                <h3 className="font-display text-xl md:text-2xl font-bold leading-snug text-slate-900 text-balance mb-3 group-hover:text-primary transition-colors">
                  {featured.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-5">
                  {featured.excerpt}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Image
                      src={featuredAuthor.avatar || "/placeholder.svg"}
                      alt={featuredAuthor.name}
                      width={28}
                      height={28}
                      className="rounded-full object-cover w-7 h-7"
                    />
                    <span className="text-xs font-medium text-slate-700">{featuredAuthor.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{featured.readingMinutes} min</span>
                  </div>
                </div>
              </div>
            </Link>
          </Reveal>

          {/* Recent posts list */}
          <div className="flex flex-col gap-4">
            {posts.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
                No articles in this category yet.
              </div>
            ) : (
              posts.map((post, i) => {
                const author = getAuthor(post.authorId)
                return (
                  <Reveal key={post.slug} delay={i * 70}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group flex items-center gap-4 sm:gap-5 rounded-2xl border border-slate-100 bg-white p-3 sm:p-4 hover:border-primary/20 hover:shadow-md transition-all duration-300"
                    >
                      <div className="relative w-24 h-24 sm:w-28 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        <Image
                          src={post.coverImage || "/placeholder.svg"}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-[1.05] transition-transform duration-500"
                          sizes="120px"
                        />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1.5">
                          {post.category}
                        </span>
                        <h3 className="font-display text-sm sm:text-base font-bold leading-snug text-slate-900 text-balance mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <div className="mt-auto flex items-center gap-3 text-xs text-slate-400">
                          <span className="font-medium text-slate-600">{author.name}</span>
                          <span aria-hidden>·</span>
                          <span>{formatPostDate(post.publishedAt)}</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                    </Link>
                  </Reveal>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
