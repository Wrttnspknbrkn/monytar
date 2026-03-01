"use client"

import type { ReactNode } from "react"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"

export function LegalPage({ title, lastUpdated, children }: { title: string; lastUpdated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      <article className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <header className="mb-12">
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight mb-3">{title}</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </header>
        <div className="prose prose-neutral dark:prose-invert max-w-none [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4 [&_li]:text-muted-foreground [&_ul]:mb-4 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_li]:leading-relaxed">
          {children}
        </div>
      </article>

      <LandingFooter />
    </div>
  )
}
