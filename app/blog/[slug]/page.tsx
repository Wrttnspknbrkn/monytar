import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Clock, Calendar } from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"
import { BlogContent } from "@/components/blog/blog-content"
import { BlogCard } from "@/components/blog/blog-card"
import { TableOfContents } from "@/components/blog/table-of-contents"
import { NewsletterSignup } from "@/components/blog/newsletter-signup"
import {
  getAllPosts,
  getPostBySlug,
  getAuthor,
  getRelatedPosts,
  formatPostDate,
} from "@/lib/blog/posts"

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: "Article not found | Monytar" }

  const author = getAuthor(post.authorId)
  return {
    title: `${post.title} | Monytar Blog`,
    description: post.excerpt,
    authors: [{ name: author.name }],
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [author.name],
      images: [{ url: post.coverImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  }
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const author = getAuthor(post.authorId)
  const related = getRelatedPosts(slug)
  const tocItems = post.content
    .filter((block) => block.type === "heading" && block.id && block.text)
    .map((block) => ({ id: block.id as string, text: block.text as string }))

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: { "@type": "Person", name: author.name },
    publisher: {
      "@type": "Organization",
      name: "Monytar",
      logo: { "@type": "ImageObject", url: "/images/monytar-blue.png" },
    },
    articleSection: post.category,
    keywords: post.tags.join(", "),
  }

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingHeader />

      {/* Article header */}
      <article>
        <header className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
          <div className="relative max-w-3xl mx-auto px-6 pt-28 pb-12 md:pt-32 md:pb-14">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to blog
            </Link>
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">{post.category}</p>
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] text-balance mb-6">
              {post.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">{post.excerpt}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <div className="flex items-center gap-3">
                <Image
                  src={author.avatar || "/placeholder.svg"}
                  alt={author.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover w-10 h-10"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{author.name}</p>
                  <p className="text-xs text-muted-foreground">{author.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {post.readingMinutes} min read
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Cover image */}
        <div className="max-w-5xl mx-auto px-6 -mt-2 mb-12">
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-border bg-secondary shadow-xl shadow-foreground/5">
            <Image
              src={post.coverImage || "/placeholder.svg"}
              alt={post.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        </div>

        {/* Body with TOC */}
        <div className="max-w-6xl mx-auto px-6 pb-16">
          <div className="grid lg:grid-cols-[1fr_240px] gap-12">
            <div className="max-w-2xl">
              <BlogContent blocks={post.content} />

              {/* Tags */}
              <div className="mt-12 pt-8 border-t border-border flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground mr-1">Tags</span>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Author bio */}
              <div className="mt-10 rounded-2xl border border-border bg-card p-6 flex gap-4">
                <Image
                  src={author.avatar || "/placeholder.svg"}
                  alt={author.name}
                  width={56}
                  height={56}
                  className="rounded-full object-cover w-14 h-14 shrink-0"
                />
                <div>
                  <p className="font-heading font-bold text-base">{author.name}</p>
                  <p className="text-xs text-primary font-semibold mb-2">{author.role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{author.bio}</p>
                </div>
              </div>
            </div>

            {/* Sticky TOC */}
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <TableOfContents items={tocItems} />
              </div>
            </aside>
          </div>
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="border-t border-border bg-secondary/20 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight mb-8">Keep reading</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <NewsletterSignup />
      <LandingFooter />
    </div>
  )
}
