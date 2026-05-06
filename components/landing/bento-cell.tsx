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
        "hover:border-primary/20 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)]",
        "transition-all duration-300",
        "flex flex-col"
      )}
    >
      {/* Text content area */}
      <div className={cn("p-6 flex-shrink-0", isLarge && "md:p-8")}>
        {/* Icon pill */}
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 border border-primary/10 px-3 py-1 mb-4">
          <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            {label}
          </span>
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

      {/* Mockup image area — fills remaining height */}
      {image ? (
        <div className="px-6 pb-0 mt-auto overflow-hidden flex-1 flex items-end">
          <div
            className={cn(
              "relative w-full rounded-t-xl",
              "shadow-[0_-2px_16px_rgba(0,0,0,0.06)]",
              "border-t border-x border-slate-100",
              "group-hover:translate-y-[-4px] transition-transform duration-300",
              isLarge ? "h-72" : isMedium ? "h-52" : "h-40"
            )}
          >
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover object-top rounded-t-xl"
            />
          </div>
        </div>
      ) : (
        <div className="px-6 pb-0 mt-auto overflow-hidden flex-1 flex items-end">
          <div
            className={cn(
              "w-full rounded-t-xl bg-slate-100",
              isLarge ? "h-64" : isMedium ? "h-48" : "h-40"
            )}
          />
        </div>
      )}
    </div>
  )
}
