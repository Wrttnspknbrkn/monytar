"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { useData } from "@/lib/providers"
import { isNavActive, navItemsForRole } from "@/lib/navigation"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { LogoutButton, SignedInAs, roleBadgeColors, useAccount } from "./account-info"

const PRIMARY_HREFS = ["/dashboard", "/requests", "/approvals"]

/**
 * Phone navigation: a bottom bar with the everyday pages plus a "More"
 * menu that lists EVERY page the signed-in role can open (the old bar only
 * had five fixed links, so Departments/Users/Reports/Notifications were
 * unreachable on a phone) along with who is signed in and a Log out button.
 */
export function MobileNav() {
  const pathname = usePathname()
  const { getPendingApprovals } = useData()
  const { user, roleLabel } = useAccount()
  const [menuOpen, setMenuOpen] = useState(false)

  // Never leave the menu open across a navigation.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const allItems = navItemsForRole(user?.role)
  const primary = allItems.filter((i) => PRIMARY_HREFS.includes(i.href))
  const approvalsCount = getPendingApprovals().length
  const moreActive = !primary.some((i) => isNavActive(pathname, i.href))

  return (
    <>
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-stretch justify-around h-16">
          {primary.map((item) => {
            const active = isNavActive(pathname, item.href)
            const Icon = item.icon
            const badge = item.href === "/approvals" ? approvalsCount : 0
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 px-2 text-[11px] relative",
                  active ? "text-primary font-semibold" : "text-muted-foreground",
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="truncate max-w-full">{item.label}</span>
                {badge > 0 && (
                  <span className="absolute top-1.5 left-1/2 ml-2 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium">
                    {badge}
                  </span>
                )}
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary" />}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            className={cn(
              "flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 px-2 text-[11px] relative",
              moreActive ? "text-primary font-semibold" : "text-muted-foreground",
            )}
          >
            <Menu className="w-5 h-5" />
            <span>More</span>
            {moreActive && <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary" />}
          </button>
        </div>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="md:hidden rounded-t-2xl p-0 max-h-[85dvh] flex flex-col">
          <SheetHeader className="p-4 pb-3 pr-14 border-b border-border text-left">
            <SheetTitle className="font-heading text-base">Menu</SheetTitle>
            <SheetDescription className="sr-only">Navigate to any page and manage your session</SheetDescription>
            <SignedInAs />
            {user && (
              <span
                className={cn(
                  "inline-flex w-fit items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider",
                  roleBadgeColors[user.role],
                )}
              >
                {roleLabel} access
              </span>
            )}
          </SheetHeader>
          <nav aria-label="All pages" className="flex-1 overflow-y-auto p-2">
            {allItems.map((item) => {
              const active = isNavActive(pathname, item.href)
              const Icon = item.icon
              const badge = item.href === "/approvals" && approvalsCount > 0 ? approvalsCount : undefined
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 min-h-12 text-sm font-medium",
                    active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary",
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {badge !== undefined && (
                    <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold">
                      {badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
          <div className="p-3 border-t border-border pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <LogoutButton className="w-full h-11" />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
