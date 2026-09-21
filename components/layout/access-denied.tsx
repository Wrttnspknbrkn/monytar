"use client"

import Link from "next/link"
import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAccount } from "./account-info"

/**
 * Shown instead of a page the signed-in role can't use. Says which role is
 * needed, which one they have, and always offers a way forward — a
 * "restricted" screen with no button is a dead end.
 */
export function AccessDenied({ title, needs, backHref = "/dashboard", backLabel = "Back to dashboard" }: { title: string; needs: string; backHref?: string; backLabel?: string }) {
  const { roleLabel } = useAccount()
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-4">
        <Shield className="w-7 h-7 text-muted-foreground/40" />
      </div>
      <h1 className="font-heading font-bold mb-1">{title}</h1>
      <p className="text-sm text-muted-foreground max-w-sm mb-5">
        {needs}
        {roleLabel ? ` You're signed in as ${roleLabel}.` : ""} Ask an admin if you think you should have access.
      </p>
      <Button asChild variant="outline" className="font-semibold">
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  )
}
