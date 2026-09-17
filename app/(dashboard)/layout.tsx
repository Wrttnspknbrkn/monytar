"use client"

import React, { useEffect, useState } from "react"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { DemoBanner } from "@/components/layout/demo-banner"
import { useAuth, useData } from "@/lib/providers"

// Every place upstream that resolves the session (auth-provider's initial
// getSession() + profile fetch, and DataProvider's own current-user fetch)
// now has its own 10s timeout so a hung request fails instead of hanging
// forever. This is the backstop behind those: if this gate is still
// blocking well past that, something upstream failed to recover on its own
// — stale/raced tokens, a bug not yet found, anything — and the right move
// is a clean redirect to a fresh login, not an indefinite spinner. A full
// navigation (not router.push) is deliberate: it doesn't depend on any of
// the React state that's presumably the thing stuck.
const STUCK_LOADING_REDIRECT_MS = 15_000

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isDemo, currentUser, isLoading } = useData()
  const { dbUser } = useAuth()
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
      window.location.href = "/login"
    }
  }, [stuck])

  // Every dashboard page reads its lists (users, vendors, departments,
  // requests, …) straight from useData() with no loading check of its own —
  // on first mount, and on every hard refresh, those all start out as `[]`
  // until the current-user → org → per-table fetches resolve. Without this
  // gate each page briefly (or, if that chain is slow, not so briefly)
  // rendered as if the org genuinely had zero of everything, which is
  // exactly what "the page is broken after a refresh" looks like. Gating
  // once here, instead of in every page, means no page can ship that bug
  // again by omission.
  if (blocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="dashboard-layout flex min-h-screen overflow-x-hidden bg-background">
      <Sidebar />
      <div className="dashboard-main flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {isDemo && <DemoBanner />}
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
          <div className="dashboard-page p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}