"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export default function VerifyEmailPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"checking" | "confirmed" | "failed">("checking")

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus("confirmed")
      return
    }

    const supabase = getSupabaseBrowserClient()

    // Supabase's browser client auto-detects the confirmation tokens from the
    // URL on load (same mechanism the reset-password page relies on for
    // recovery links) and fires SIGNED_IN once the session is established.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") setStatus("confirmed")
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatus("confirmed")
    })

    // If nothing establishes a session within a few seconds, the link was
    // likely already used, expired, or malformed.
    const timeout = setTimeout(() => {
      setStatus((current) => (current === "checking" ? "failed" : current))
    }, 6000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (status === "confirmed") {
      const t = setTimeout(() => router.push("/dashboard"), 1200)
      return () => clearTimeout(t)
    }
  }, [status, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="font-display font-bold text-2xl text-foreground">
            Monytar
          </Link>
        </div>

        {status === "checking" && (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-5" />
            <h1 className="font-display text-xl font-bold tracking-tight mb-1.5">Confirming your email...</h1>
            <p className="text-sm text-muted-foreground">This only takes a moment.</p>
          </>
        )}

        {status === "confirmed" && (
          <>
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight mb-1.5">Email confirmed</h1>
            <p className="text-sm text-muted-foreground">Taking you to your dashboard...</p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 mx-auto mb-5">
              <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight mb-1.5">Link expired or already used</h1>
            <p className="text-sm text-muted-foreground mb-6">Try signing in — if your email is already confirmed, that&apos;s all you need.</p>
            <Link href="/login">
              <Button className="font-semibold">Go to sign in</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
