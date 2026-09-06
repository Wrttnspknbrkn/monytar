"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type RevealVariant = "rise" | "grow" | "wipe" | "wipe-x" | "blur"

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  id?: string
  /**
   * Motion technique used on first scroll-into-view. Defaults to "rise" (the
   * original fade + slide-up) so existing call sites are unaffected.
   */
  variant?: RevealVariant
}

const HIDDEN: Record<RevealVariant, string> = {
  rise: "opacity-0 translate-y-6",
  grow: "opacity-0 scale-[0.94]",
  wipe: "opacity-100 [clip-path:inset(0_0_100%_0)]",
  "wipe-x": "opacity-100 [clip-path:inset(0_100%_0_0)]",
  blur: "opacity-0 translate-y-2.5 blur-[6px]",
}

const VISIBLE: Record<RevealVariant, string> = {
  rise: "opacity-100 translate-y-0",
  grow: "opacity-100 scale-100",
  wipe: "opacity-100 [clip-path:inset(0_0_0%_0)]",
  "wipe-x": "opacity-100 [clip-path:inset(0_0%_0_0)]",
  blur: "opacity-100 translate-y-0 blur-0",
}

const TRANSITION: Record<RevealVariant, string> = {
  rise: "transition-[opacity,transform] duration-700 ease-out",
  grow: "transition-[opacity,transform] duration-600 [transition-timing-function:cubic-bezier(.16,1,.3,1)]",
  wipe: "transition-[clip-path] duration-[900ms] [transition-timing-function:cubic-bezier(.22,1,.36,1)]",
  "wipe-x": "transition-[clip-path] duration-[950ms] [transition-timing-function:cubic-bezier(.22,1,.36,1)]",
  blur: "transition-[opacity,transform,filter] duration-700 ease-out",
}

/**
 * Reveals children the first time they scroll into view. `variant` picks the
 * motion technique so sections don't all use the same fade-up. Respects
 * prefers-reduced-motion (skips straight to the visible state).
 */
export function Reveal({ children, className, delay = 0, variant = "rise", id }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true)
      return
    }

    function isInView() {
      const rect = node!.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      // Roughly matches the old rootMargin/threshold: the element counts as
      // in view once its top has crossed ~15% up from the bottom edge.
      return rect.top < viewportHeight - viewportHeight * 0.15 && rect.bottom > 0
    }

    // Content already in the viewport on mount (e.g. above-the-fold hero
    // copy) reveals immediately instead of waiting on any async callback.
    if (isInView()) {
      setVisible(true)
      return
    }

    let revealed = false
    function reveal() {
      if (revealed) return
      revealed = true
      setVisible(true)
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
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    )
    observer.observe(node)

    // Fallback: some environments (backgrounded/automated tabs, certain
    // embedders) throttle or never fire IntersectionObserver callbacks even
    // once the element is clearly on screen. A cheap rAF-batched scroll
    // check guarantees content never gets stuck invisible.
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
    <div
      ref={ref}
      id={id}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={cn(
        "will-change-transform",
        TRANSITION[variant],
        visible ? VISIBLE[variant] : HIDDEN[variant],
        className
      )}
    >
      {children}
    </div>
  )
}
