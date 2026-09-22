"use client"

import { useEffect } from "react"

/**
 * Seeds a page's search box from `?q=` once on mount (used by the global
 * search palette to land on a pre-filtered list). Reads window.location
 * directly instead of useSearchParams so pages don't need a Suspense
 * boundary just for this.
 */
export function useInitialSearchQuery(apply: (q: string) => void) {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q")
    if (q) apply(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
