"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import markerData from "@/components/help/markers.json"
import { TOUR } from "./handbook-content"

const manifest = markerData as unknown as Record<string, { width: number; height: number }>

/** A guided look at the real screens: pick one, read what to look for, tap to view full size. */
export function ScreensTour() {
  const [i, setI] = useState(0)
  const [zoom, setZoom] = useState(false)
  const screen = TOUR[i]
  const go = (n: number) => setI((n + TOUR.length) % TOUR.length)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (zoom) return
      const target = e.target as HTMLElement | null
      if (target && /input|textarea|select/i.test(target.tagName)) return
      if (e.key === "ArrowRight") setI((n) => (n + 1) % TOUR.length)
      if (e.key === "ArrowLeft") setI((n) => (n - 1 + TOUR.length) % TOUR.length)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [zoom])

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Screens" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TOUR.map((t, idx) => (
          <button
            key={t.image}
            type="button"
            role="tab"
            aria-selected={idx === i}
            onClick={() => setI(idx)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              idx === i ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {t.title}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label={`View ${screen.title} full size`}
          className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card text-left shadow-lg shadow-foreground/[0.06] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            key={screen.image}
            src={`/images/help/${screen.image}.png`}
            alt={`${screen.title} screen`}
            width={manifest[screen.image].width}
            height={manifest[screen.image].height}
            sizes="(min-width: 1024px) 620px, 94vw"
            className="animate-fade-in h-auto w-full"
          />
          <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-foreground/85 px-3 py-1.5 text-xs font-semibold text-background opacity-90 transition-opacity group-hover:opacity-100">
            <Maximize2 className="h-3.5 w-3.5" /> Full size
          </span>
        </button>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Screen {i + 1} of {TOUR.length}
            </p>
            <h3 className="mt-1 font-display text-2xl tracking-tight">{screen.title}</h3>
          </div>
          <p className="text-sm font-semibold text-muted-foreground">Look for</p>
          <ul key={screen.image} className="flex flex-col gap-2.5">
            {screen.looks.map((l, idx) => (
              <li key={l} className="animate-fade-in flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3 text-sm" style={{ animationDelay: `${idx * 80}ms` }}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{idx + 1}</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={() => go(i - 1)} aria-label="Previous screen" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition-colors hover:border-primary/40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => go(i + 1)} aria-label="Next screen" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition-colors hover:border-primary/40">
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="ml-1 hidden text-xs text-muted-foreground sm:inline">or use ← → keys</span>
          </div>
        </div>
      </div>

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-6xl gap-2 p-3 sm:p-4">
          <DialogTitle className="pr-8 font-heading text-base">{screen.title}</DialogTitle>
          <DialogDescription className="sr-only">Full-size screenshot</DialogDescription>
          <div className="overflow-auto rounded-xl border border-border/60">
            <Image
              src={`/images/help/${screen.image}.png`}
              alt={`${screen.title} screen, full size`}
              width={manifest[screen.image].width}
              height={manifest[screen.image].height}
              sizes="1152px"
              className="h-auto w-full min-w-[720px]"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
