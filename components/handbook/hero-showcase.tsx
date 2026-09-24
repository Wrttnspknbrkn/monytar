"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import markerData from "@/components/help/markers.json"
import { SHOWCASE } from "./handbook-content"

const manifest = markerData as unknown as Record<string, { width: number; height: number }>

/** A browser-framed slideshow of real screens. Pauses on hover; dots jump to a slide. */
export function HeroShowcase() {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = window.setInterval(() => setI((n) => (n + 1) % SHOWCASE.length), 4200)
    return () => window.clearInterval(t)
  }, [paused])

  const current = SHOWCASE[i]

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} className="relative">
      <div className="absolute -inset-4 rounded-[2rem] bg-white/10 blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-white/25 bg-white shadow-2xl shadow-black/30">
        <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 truncate rounded-md bg-white px-3 py-0.5 text-[10px] font-medium text-slate-500">monytar</span>
        </div>
        <div className="relative aspect-[1200/760] bg-slate-50">
          {SHOWCASE.map((s, idx) => (
            <Image
              key={s.image}
              src={`/images/help/${s.image}.png`}
              alt={s.caption}
              width={manifest[s.image].width}
              height={manifest[s.image].height}
              sizes="(min-width: 1024px) 560px, 92vw"
              priority={idx === 0}
              className={cn("absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700 motion-reduce:transition-none", idx === i ? "opacity-100" : "opacity-0")}
            />
          ))}
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-3">
        <p key={current.caption} className="animate-fade-in text-sm font-medium text-white/90">{current.caption}</p>
        <div className="flex shrink-0 gap-1.5" role="tablist" aria-label="Screens">
          {SHOWCASE.map((s, idx) => (
            <button
              key={s.image}
              type="button"
              role="tab"
              aria-selected={idx === i}
              aria-label={`Show screen ${idx + 1}`}
              onClick={() => setI(idx)}
              className={cn("h-2 rounded-full transition-all", idx === i ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70")}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
