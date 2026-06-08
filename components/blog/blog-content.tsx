import { Quote } from "lucide-react"
import type { BlogContentBlock } from "@/lib/blog/posts"

interface BlogContentProps {
  blocks: BlogContentBlock[]
}

export function BlogContent({ blocks }: BlogContentProps) {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={index}
                id={block.id}
                className="font-heading text-2xl font-extrabold tracking-tight scroll-mt-28 pt-4"
              >
                {block.text}
              </h2>
            )
          case "paragraph":
            return (
              <p key={index} className="text-base md:text-lg text-foreground/85 leading-relaxed">
                {block.text}
              </p>
            )
          case "list":
            return (
              <ul key={index} className="flex flex-col gap-3 pl-1">
                {block.items?.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-base md:text-lg text-foreground/85 leading-relaxed">
                    <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )
          case "quote":
            return (
              <blockquote
                key={index}
                className="relative rounded-2xl border border-border bg-secondary/40 p-6 md:p-8"
              >
                <Quote className="w-6 h-6 text-primary/30 mb-3" aria-hidden="true" />
                <p className="font-heading text-xl md:text-2xl font-bold leading-snug text-balance text-foreground">
                  {block.text}
                </p>
                {block.attribution && (
                  <footer className="mt-4 text-sm font-medium text-muted-foreground">{block.attribution}</footer>
                )}
              </blockquote>
            )
          case "callout":
            return (
              <div
                key={index}
                className="rounded-2xl border-l-4 border-primary bg-primary/5 px-6 py-5"
              >
                <p className="text-base text-foreground/90 leading-relaxed">{block.text}</p>
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
