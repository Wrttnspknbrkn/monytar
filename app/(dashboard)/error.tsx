"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, LayoutDashboard, LogOut } from "lucide-react"
import { useAuth } from "@/lib/providers"

/**
 * Scoped to the dashboard route group so an error on one page (e.g.
 * /settings) replaces only the content area, not the whole app — the
 * sidebar/header stay mounted (they're siblings in (dashboard)/layout.tsx,
 * outside this boundary) so the user can still navigate away instead of
 * being stuck on a blank page with nothing to do. The actions below are a
 * second way out that doesn't depend on the chrome working at all.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { signOut } = useAuth()

  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center" role="alert">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30 mb-5">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <h2 className="font-heading text-xl font-bold tracking-tight mb-2">This page hit a snag</h2>
      <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm">
        Something went wrong loading this page. Your data is safe and your session is still active — try again, go back to the dashboard, or log out and start a fresh session.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-sm">
        <Button onClick={reset} className="flex-1 font-semibold shadow-sm shadow-primary/20">
          <RefreshCw className="w-4 h-4 mr-2" /> Try again
        </Button>
        <Button asChild variant="outline" className="flex-1 font-semibold bg-transparent">
          <Link href="/dashboard">
            <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
          </Link>
        </Button>
        <Button variant="outline" className="flex-1 font-semibold bg-transparent" onClick={() => void signOut()}>
          <LogOut className="w-4 h-4 mr-2" /> Log out
        </Button>
      </div>
    </div>
  )
}
