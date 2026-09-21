"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Loader2, LogOut, RefreshCw } from "lucide-react"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { DemoBanner } from "@/components/layout/demo-banner"
import { InteractionGuard } from "@/components/layout/interaction-guard"
import { Button } from "@/components/ui/button"
import { useAuth, useData } from "@/lib/providers"
import { pageTitleFor } from "@/lib/navigation"

// Every place upstream that resolves the session (auth-provider's initial
// getSession() + profile fetch, and DataProvider's own current-user fetch)
// has its own 10s timeout so a hung request fails instead of hanging
// forever. This is the backstop behind those: if this gate is still
// blocking well past that, something upstream failed to recover on its own
// and the right move is a clean redirect to a fresh login, not an
// indefinite spinner. A full navigation (not router.push) is deliberate: it
// doesn't depend on any of the React state that's presumably the thing stuck.
const STUCK_LOADING_REDIRECT_MS = 15_000
// Long before that, start offering manual ways out.
const SHOW_ESCAPE_HATCH_MS = 4_000

function LoadingScreen({ onRetry, onSignOut }: { onRetry: () => void; onSignOut: () => void }) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), SHOW_ESCAPE_HATCH_MS)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-dvh bg-background px-6 text-center" role="status" aria-live="polite">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      {slow && (
        <div className="flex flex-col items-center gap-3 max-w-xs">
          <p className="text-sm text-muted-foreground">This is taking longer than expected. You can retry, or sign out and start a fresh session.</p>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button variant="outline" className="flex-1 gap-2" onClick={onRetry}>
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={onSignOut}>
              <LogOut className="w-4 h-4" /> Log out
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isDemo, currentUser, isLoading } = useData()
  const { dbUser, signOut } = useAuth()
  const user = dbUser || currentUser
  const blocked = !isDemo && (isLoading || !user)

  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    if (!blocked) {
      setStuck(false)
      return
    }
    const timer = setTimeout(() => setStuck(true), STUCK_LOADING_REDIRECT_MS)
    return () => clearTimeout(timer)
  }, [blocked])

  useEffect(() => {
    if (stuck) {
      window.location.href = "/login?reason=timeout"
    }
  }, [stuck])

  // Tab title follows the page so browser tabs/history say where you are.
  useEffect(() => {
    document.title = `${pageTitleFor(pathname)} | Monytar`
  }, [pathname])

  // Every dashboard page reads its lists (users, vendors, departments,
  // requests, …) straight from useData() with no loading check of its own —
  // on first mount, and on every hard refresh, those all start out as `[]`
  // until the current-user → org → per-table fetches resolve. Without this
  // gate each page briefly rendered as if the org genuinely had zero of
  // everything. Gating once here means no page can ship that bug by omission.
  if (blocked) {
    return <LoadingScreen onRetry={() => window.location.reload()} onSignOut={() => void signOut()} />
  }

  return (
    <div className="dashboard-layout flex min-h-dvh overflow-x-clip bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <InteractionGuard />
      <Sidebar />
      <div className="dashboard-main flex-1 flex flex-col min-w-0">
        {isDemo && <DemoBanner />}
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1 pb-24 md:pb-0 outline-none">
          <div className="dashboard-page p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
