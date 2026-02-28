"use client"

import { useState } from "react"
import { AlertTriangle, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="relative bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/40 px-4 py-2.5">
      <div className="flex items-center justify-center gap-3 text-sm">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-amber-800 dark:text-amber-300 font-medium">
          {"You're in demo mode."}{" "}
          <span className="text-amber-600 dark:text-amber-400 font-normal">
            Data is stored in-memory and resets on reload. Switch roles from the user menu to explore different views.
          </span>
        </p>
        <Link
          href="/pricing"
          className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline whitespace-nowrap"
        >
          Go Live <ExternalLink className="w-3 h-3" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-amber-600 hover:text-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30"
          onClick={() => setDismissed(true)}
        >
          <X className="w-3.5 h-3.5" />
          <span className="sr-only">Dismiss demo banner</span>
        </Button>
      </div>
    </div>
  )
}
