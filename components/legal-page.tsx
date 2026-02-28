"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"

export function LegalPage({ title, lastUpdated, children }: { title: string; lastUpdated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          <Link href="/" className="flex items-center group">
            <Logo size="md" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Features</Link>
            <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Pricing</Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">About</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm font-medium">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="text-sm font-medium shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/30 transition-all">
                Get Started <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <header className="mb-12">
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight mb-3">{title}</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </header>
        <div className="prose prose-neutral dark:prose-invert max-w-none [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4 [&_li]:text-muted-foreground [&_ul]:mb-4 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_li]:leading-relaxed">
          {children}
        </div>
      </article>

      <footer className="py-12 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">&copy; 2026 SpendWell. All rights reserved.</p>
            <p className="text-sm text-muted-foreground">Developed by <a href="https://www.gydgen.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors">GydGen</a></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
