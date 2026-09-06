"use client"

import { useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TiltCardProps {
  children: ReactNode
  className?: string
}

/**
 * A card that tilts toward the cursor and shows a cursor-following glow.
 * Driven entirely by direct style writes on refs (no React state), so it
 * never re-renders the tree on pointer move. No-ops under
 * prefers-reduced-motion.
 */
export function TiltCard({ children, className }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const card = cardRef.current
    const glow = glowRef.current
    if (!card || !glow) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const rx = ((y / rect.height) - 0.5) * -6
    const ry = ((x / rect.width) - 0.5) * 6
    card.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg)`
    glow.style.background = `radial-gradient(240px circle at ${x}px ${y}px, hsl(var(--primary) / 0.25), transparent 60%)`
    glow.style.opacity = "1"
  }

  function handlePointerLeave() {
    const card = cardRef.current
    const glow = glowRef.current
    if (card) card.style.transform = ""
    if (glow) glow.style.opacity = "0"
  }

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white/[0.05] border border-white/8",
        "hover:bg-white/[0.07] hover:border-white/15",
        "[transition:transform_150ms_ease,background-color_300ms_ease,border-color_300ms_ease]",
        className
      )}
    >
      <div ref={glowRef} className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300" />
      <div className="relative">{children}</div>
    </div>
  )
}
