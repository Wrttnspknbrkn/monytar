"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

/**
 * Scoped to the dashboard route group so an error on one page (e.g.
 * /settings) replaces only the content area, not the whole app — the
 * sidebar/header stay mounted (they're siblings in (dashboard)/layout.tsx,
 * outside this boundary) so the user can still navigate away instead of
 * being stuck on a blank page with nothing to do.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30 mb-5">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <h2 className="font-heading text-xl font-bold tracking-tight mb-2">This page hit a snag</h2>
      <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm">
        Something went wrong loading this page. Your session is still active — try again, or use the sidebar to go elsewhere.
      </p>
      <Button onClick={reset} className="font-semibold shadow-sm shadow-primary/20">
        <RefreshCw className="w-4 h-4 mr-2" /> Try Again
      </Button>
    </div>
  )
}
