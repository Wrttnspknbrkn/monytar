"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ParallaxFrameProps {
  children: ReactNode
  className?: string
  /** Max translateY in px as the element travels through the viewport. */
  strength?: number
}

/**
 * Subtle scroll-linked drift on a single element. Reads scroll position in a
 * passive listener but only ever writes a transform directly to the DOM
 * node inside a single rAF-batched callback per frame — it never touches
 * React state, so there is no re-render cost. No-ops under
 * prefers-reduced-motion.
 */
export function ParallaxFrame({ children, className, strength = 26 }: ParallaxFrameProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let ticking = false
    function update() {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const progress = Math.min(Math.max((vh - rect.top) / (vh + rect.height), 0), 1)
      el.style.transform = `translateY(${(progress - 0.5) * strength}px)`
      ticking = false
    }
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [strength])

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  )
}
