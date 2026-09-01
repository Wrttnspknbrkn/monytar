"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * A horizontal line that draws itself left-to-right (scaleX) the first time
 * it scrolls into view, tying together a real numbered sequence. Collapses
 * to fully-drawn under prefers-reduced-motion.
 */
export function ConnectorLine({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDrawn(true)
      return
    }

    function isInView() {
      const rect = node!.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      return rect.top < viewportHeight * 0.6 && rect.bottom > 0
    }

    if (isInView()) {
      setDrawn(true)
      return
    }

    let revealed = false
    function reveal() {
      if (revealed) return
      revealed = true
      setDrawn(true)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      observer.disconnect()
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) reveal()
        })
      },
      { threshold: 0.4 }
    )
    observer.observe(node)

    // Fallback for environments where IntersectionObserver callbacks are
    // throttled or never fire even once the element is on screen.
    let ticking = false
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        if (isInView()) reveal()
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  return (
    <div ref={ref} className={cn("absolute h-px bg-slate-200 overflow-hidden", className)}>
      <div
        className={cn(
          "absolute inset-0 origin-left bg-primary transition-transform duration-[1100ms] [transition-timing-function:cubic-bezier(.22,1,.36,1)]",
          drawn ? "scale-x-100" : "scale-x-0"
        )}
      />
    </div>
  )
}
