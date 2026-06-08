"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { BlogCard } from "@/components/blog/blog-card"
import type { BlogPost, BlogCategory } from "@/lib/blog/posts"

interface BlogIndexProps {
  posts: BlogPost[]
  categories: { name: BlogCategory; description: string }[]
}

export function BlogIndex({ posts, categories }: BlogIndexProps) {
  const [activeCategory, setActiveCategory] = useState<BlogCategory | "All">("All")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = activeCategory === "All" || post.category === activeCategory
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q === "" ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q))
      return matchesCategory && matchesQuery
    })
  }, [posts, activeCategory, query])

  const filters: ("All" | BlogCategory)[] = ["All", ...categories.map((c) => c.name)]

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col gap-5 mb-10">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <label htmlFor="blog-search" className="sr-only">
            Search articles
          </label>
          <Input
            id="blog-search"
            type="search"
            placeholder="Search articles"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
          {filters.map((filter) => (
            <button
              key={filter}
              role="tab"
              aria-selected={activeCategory === filter}
              onClick={() => setActiveCategory(filter)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                activeCategory === filter
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/30",
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-secondary/30 py-16 text-center">
          <p className="font-heading text-lg font-bold mb-1">No articles found</p>
          <p className="text-sm text-muted-foreground">Try a different search or category.</p>
        </div>
      )}
    </div>
  )
}
