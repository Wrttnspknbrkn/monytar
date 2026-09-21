"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-6" role="alert">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight mb-2">Something went wrong</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          An unexpected error occurred. Try again, or head back and start over — if you were signed in, your session is unaffected.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={reset} className="font-semibold shadow-sm shadow-primary/25 w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" /> Try again
          </Button>
          <Button asChild variant="outline" className="font-semibold w-full sm:w-auto">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="font-semibold w-full sm:w-auto">
            <Link href="/login">Sign in again</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
