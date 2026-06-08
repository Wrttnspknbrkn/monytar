import Link from "next/link"
import Image from "next/image"
import { Clock } from "lucide-react"
import type { BlogPost } from "@/lib/blog/posts"
import { getAuthor, formatPostDate } from "@/lib/blog/posts"

interface BlogCardProps {
  post: BlogPost
  priority?: boolean
}

export function BlogCard({ post, priority = false }: BlogCardProps) {
  const author = getAuthor(post.authorId)

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-foreground/[0.03] hover:-translate-y-0.5"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        <Image
          src={post.coverImage || "/placeholder.svg"}
          alt={post.title}
          fill
          priority={priority}
          className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">{post.category}</span>
        </div>
        <h3 className="font-heading text-lg font-bold leading-snug text-balance mb-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src={author.avatar || "/placeholder.svg"}
              alt={author.name}
              width={28}
              height={28}
              className="rounded-full object-cover w-7 h-7"
            />
            <span className="text-xs font-medium text-foreground">{author.name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{post.readingMinutes} min</span>
          </div>
        </div>
        <time className="sr-only" dateTime={post.publishedAt}>
          {formatPostDate(post.publishedAt)}
        </time>
      </div>
    </Link>
  )
}
