"use client"

import React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  // Supabase establishes a recovery session from the link in the URL.
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true)
      return
    }
    const supabase = getSupabaseBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true)
      }
    })
    // Also handle the case where the session is already present.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (password !== confirm) {
      toast.error("Passwords do not match")
      return
    }

    if (!isSupabaseConfigured()) {
      toast.success("Demo mode: password would be updated in production")
      router.push("/login")
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        toast.error(error.message || "Could not update password")
        return
      }
      toast.success("Password updated. Please sign in.")
      await supabase.auth.signOut()
      router.push("/login")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="font-display font-bold text-2xl text-foreground">
            Monytar
          </Link>
        </div>

        <div className="mb-8 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mx-auto mb-5">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-1.5">Set a new password</h1>
          <p className="text-sm text-muted-foreground">Choose a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-[13px] font-medium">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm" className="text-[13px] font-medium">Confirm password</Label>
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="h-10"
            />
          </div>

          <Button type="submit" className="w-full h-10 font-semibold" disabled={loading || !ready}>
            {loading ? "Updating..." : !ready ? "Verifying link..." : "Update password"}
            {!loading && ready && <ArrowRight className="w-4 h-4 ml-1.5" />}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground mt-6">
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
