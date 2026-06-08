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

  // Only the homepage has a full-bleed dark hero behind the header.
  // Every other marketing/content page has a light background at the top,
  // so the header must render solid with dark text immediately.
  const hasDarkHero = pathname === "/"

  // "dark" here means dark text on a light/solid header.
  const useDark = scrolled || !hasDarkHero

  useEffect(() => {
    const handleScroll = () => {
      // Check if we've scrolled past the hero (roughly 100vh or the hero text)
      setScrolled(window.scrollY > 80)
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        useDark
          ? "bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 md:h-16 px-4 sm:px-6">
        {/* Logo / Wordmark */}
        <Link href="/" className="flex items-center">
          <span
            className={cn(
              "font-display font-semibold text-xl transition-colors duration-200",
              useDark ? "text-slate-900" : "text-white"
            )}
          >
            Monytar
          </span>
        </Link>

        {/* Desktop Nav */}
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

        {/* Desktop CTA */}
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

        {/* Mobile menu button */}
        <button
          className={cn(
            "md:hidden flex items-center justify-center w-11 h-11 rounded-lg transition-colors",
            useDark ? "hover:bg-slate-100" : "hover:bg-white/10"
          )}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className={cn("w-5 h-5", useDark ? "text-slate-900" : "text-white")} />
          ) : (
            <Menu className={cn("w-5 h-5", useDark ? "text-slate-900" : "text-white")} />
          )}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-white z-[100]">
          <div className="flex flex-col p-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-semibold text-slate-900 py-3 border-b border-slate-100"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-6">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full h-12 text-base">
                  Log in
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)}>
                <Button className="w-full h-12 text-base rounded-full">
                  Start free <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
