"use client"

import Image from "next/image"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface BentoCellProps {
  cols: string
  size: "large" | "medium" | "small"
  label: string
  Icon: LucideIcon
  title: string
  body: string
  image?: string
}

export function BentoCell({ cols, size, label, Icon, title, body, image }: BentoCellProps) {
  const isLarge = size === "large"
  const isMedium = size === "medium"

  return (
    <div
      className={cn(
        cols,
        "group relative rounded-2xl bg-white border border-slate-100 overflow-hidden",
        "hover:border-primary/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
        "transition-all duration-300 flex flex-col"
      )}
    >
      {/* Text content */}
      <div className={cn("p-6 flex-shrink-0", isLarge && "md:p-8")}>
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 border border-primary/10 px-3 py-1 mb-4">
          <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
          <span className="text-xs font-bold uppercase tracking-widest text-primary">{label}</span>
        </div>
        <h3
          className={cn(
            "font-semibold text-slate-900 mb-2 leading-snug",
            isLarge ? "text-xl md:text-2xl" : "text-lg"
          )}
        >
          {title}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
      </div>

      {/* Image area */}
      {image && (
        <div
          className={cn(
            "mx-6 mb-0 mt-auto rounded-t-xl overflow-hidden",
            "border-t border-x border-slate-100 bg-slate-50",
            "group-hover:-translate-y-1 transition-transform duration-300",
            isLarge ? "mx-8" : ""
          )}
        >
          <Image
            src={image}
            alt={title}
            width={isLarge ? 900 : isMedium ? 600 : 400}
            height={isLarge ? 480 : isMedium ? 320 : 260}
            className="w-full h-auto object-contain object-bottom"
          />
        </div>
      )}

      {!image && (
        <div className="mx-6 mb-0 mt-auto rounded-t-xl bg-slate-100 h-40" />
      )}
    </div>
  )
}