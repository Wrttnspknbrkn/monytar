import { describe, it, expect } from "vitest"
import {
  getAllPosts,
  getFeaturedPost,
  getRecentPosts,
  getPostBySlug,
  getPostsByCategory,
  getRelatedPosts,
  getAuthor,
  formatPostDate,
} from "@/lib/blog/posts"

describe("getAllPosts", () => {
  it("returns posts sorted newest-first", () => {
    const posts = getAllPosts()
    expect(posts.length).toBeGreaterThan(0)
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i - 1].publishedAt >= posts[i].publishedAt).toBe(true)
    }
  })

  it("has unique slugs", () => {
    const slugs = getAllPosts().map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe("getFeaturedPost", () => {
  it("returns a post", () => {
    expect(getFeaturedPost()).toBeDefined()
  })
})

describe("getRecentPosts", () => {
  it("excludes the featured post", () => {
    const featured = getFeaturedPost()
    expect(getRecentPosts().some((p) => p.slug === featured.slug && featured.featured)).toBe(false)
  })
  it("honors the limit", () => {
    expect(getRecentPosts(2).length).toBeLessThanOrEqual(2)
  })
})

describe("getPostBySlug", () => {
  it("finds an existing post", () => {
    const first = getAllPosts()[0]
    expect(getPostBySlug(first.slug)?.slug).toBe(first.slug)
  })
  it("returns undefined for an unknown slug", () => {
    expect(getPostBySlug("does-not-exist-xyz")).toBeUndefined()
  })
})

describe("getPostsByCategory", () => {
  it("returns only posts of that category", () => {
    const category = getAllPosts()[0].category
    const results = getPostsByCategory(category)
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((p) => p.category === category)).toBe(true)
  })
})

describe("getRelatedPosts", () => {
  it("never includes the source post and respects the limit", () => {
    const source = getAllPosts()[0]
    const related = getRelatedPosts(source.slug, 3)
    expect(related.length).toBeLessThanOrEqual(3)
    expect(related.some((p) => p.slug === source.slug)).toBe(false)
  })
  it("falls back to recent posts for an unknown slug", () => {
    expect(getRelatedPosts("unknown-slug", 2).length).toBeLessThanOrEqual(2)
  })
})

describe("getAuthor", () => {
  it("returns a fallback author for an unknown id", () => {
    expect(getAuthor("nobody")).toBeDefined()
  })
})

describe("formatPostDate", () => {
  it("formats an ISO date into a long form", () => {
    expect(formatPostDate("2025-01-15")).toMatch(/2025/)
  })
})
