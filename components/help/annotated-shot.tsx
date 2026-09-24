"use client"

import Image from "next/image"
import { ExternalLink } from "lucide-react"
import markerData from "./markers.json"
import startMarkerData from "@/components/handbook/start-markers.json"

interface Marker {
  n: number
  x: number
  y: number
  w: number
  h: number
}
type Manifest = Record<string, { width: number; height: number; markers: Marker[] }>
// Help-page screenshots, plus the handbook's "Getting started" ones (own file, so re-running the
// help capture script never wipes them).
const manifest = { ...(markerData as Manifest), ...(startMarkerData as Manifest) }

/**
 * A real screenshot of the app. When `active` is set, everything except that
 * numbered marker is dimmed, so the eye goes to exactly the spot the current
 * step is talking about. Marker positions come from components/help/markers.json,
 * written by scripts/capture-help-screenshots.mjs.
 */
export function AnnotatedShot({ image, active, alt, priority }: { image: string; active?: number; alt: string; priority?: boolean }) {
  const shot = manifest[image]
  if (!shot) return null
  const marker = active ? shot.markers.find((m) => m.n === active) : undefined
  const pct = (v: number, total: number) => `${(v / total) * 100}%`

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-secondary/30 shadow-sm">
        <Image
          src={`/images/help/${image}.png`}
          alt={alt}
          width={shot.width}
          height={shot.height}
          sizes="(min-width: 1024px) 640px, 100vw"
          priority={priority}
          className="h-auto w-full select-none"
          draggable={false}
        />
        {marker && (
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-lg transition-all duration-300 ease-out motion-reduce:transition-none"
            style={{
              left: `calc(${pct(marker.x, shot.width)} - 6px)`,
              top: `calc(${pct(marker.y, shot.height)} - 6px)`,
              width: `calc(${pct(marker.w, shot.width)} + 12px)`,
              height: `calc(${pct(marker.h, shot.height)} + 12px)`,
              boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55), 0 0 0 3px #fff",
            }}
          />
        )}
      </div>
      <figcaption className="flex justify-end">
        <a
          href={`/images/help/${image}.png`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          Open full size <ExternalLink className="h-3 w-3" />
        </a>
      </figcaption>
    </figure>
  )
}
