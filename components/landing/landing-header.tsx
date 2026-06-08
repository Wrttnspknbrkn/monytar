"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Resources", href: "/resources" },
  { label: "Demo", href: "/demo" },
]

export function LandingHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const hasDarkHero = pathname === "/"
  const useDark = scrolled || !hasDarkHero

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
      document.body.style.touchAction = "none"
    } else {
      document.body.style.overflow = ""
      document.body.style.touchAction = ""
    }
    return () => {
      document.body.style.overflow = ""
      document.body.style.touchAction = ""
    }
  }, [mobileOpen])

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          useDark
            ? "bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <Link href="/" className="flex items-center" onClick={() => setMobileOpen(false)}>
            <span
              className={cn(
                "font-display font-semibold text-xl transition-colors duration-200",
                mobileOpen
                  ? "text-slate-900"
                  : useDark
                    ? "text-slate-900"
                    : "text-white"
              )}
            >
              Monytar
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  useDark
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-white/80 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <span
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  useDark
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-white/80 hover:text-white"
                )}
              >
                Log in
              </span>
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="rounded-full bg-primary text-white px-5 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              >
                Start free
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

          <button
            className={cn(
              "md:hidden relative z-[110] flex items-center justify-center w-11 h-11 rounded-lg transition-colors",
              mobileOpen
                ? "hover:bg-slate-100"
                : useDark
                  ? "hover:bg-slate-100"
                  : "hover:bg-white/10"
            )}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <span
              className={cn(
                "absolute transition-all duration-200",
                mobileOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
              )}
            >
              <X className="w-5 h-5 text-slate-900" />
            </span>
            <span
              className={cn(
                "absolute transition-all duration-200",
                mobileOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"
              )}
            >
              <Menu
                className={cn(
                  "w-5 h-5",
                  useDark ? "text-slate-900" : "text-white"
                )}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile overlay — rendered outside header so it truly fills the viewport */}
      <div
        className={cn(
          "fixed inset-0 z-[100] md:hidden flex flex-col bg-white transition-all duration-500 ease-in-out",
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        {/* Subtle decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col h-full px-6 pt-24 pb-10">
          <nav className="flex flex-col gap-1 flex-1">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center justify-between py-4 border-b border-slate-100",
                  "transition-all duration-300 ease-out",
                  mobileOpen
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-4"
                )}
                style={{
                  transitionDelay: mobileOpen ? `${120 + i * 60}ms` : "0ms",
                }}
              >
                <span className="text-2xl font-semibold tracking-tight text-slate-900 group-hover:text-primary transition-colors duration-200">
                  {link.label}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
              </Link>
            ))}
          </nav>

          <div
            className={cn(
              "flex flex-col gap-3 pt-6 transition-all duration-300 ease-out",
              mobileOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
            style={{ transitionDelay: mobileOpen ? "480ms" : "0ms" }}
          >
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button
                variant="outline"
                className="w-full h-13 text-base font-medium border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                Log in
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setMobileOpen(false)}>
              <Button className="w-full h-13 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
                Start free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}