import type { MetadataRoute } from "next"
import { getAllPosts } from "@/lib/blog/posts"
import { absoluteUrl } from "@/lib/seo"

// Indexable public pages only. Sign-in, checkout, the signed-in app and the shareable
// handbook are deliberately left out. `lastModified` is only given where it is a real
// date (blog posts), because search engines ignore a value that changes on every build.
const PAGES = ["/", "/features", "/pricing", "/about", "/contact", "/demo", "/blog", "/changelog", "/resources", "/security", "/privacy", "/terms", "/gdpr"]

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()
  return [
    ...PAGES.map((path) => ({ url: absoluteUrl(path), ...(path === "/blog" && posts[0] ? { lastModified: posts[0].updatedAt ?? posts[0].publishedAt } : {}) })),
    ...posts.map((p) => ({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: p.updatedAt ?? p.publishedAt })),
  ]
}
