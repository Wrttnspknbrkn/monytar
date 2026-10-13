"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, LogOut, Wallet } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { cn, getInitials } from "@/lib/utils"
import { useData } from "@/lib/providers"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState } from "react"
import { isNavActive, navItemsForRole } from "@/lib/navigation"
import { SignedInAs, roleAvatarColors, useAccount } from "./account-info"

export function Sidebar() {
  const pathname = usePathname()
  const { getMyRequests, getPendingApprovals } = useData()
  const { user, roleLabel, signOut } = useAccount()
  const [collapsed, setCollapsed] = useState(false)

  const myPendingCount = getMyRequests().filter((r) => r.status === "pending").length
  const approvalsCount = getPendingApprovals().length

  const filteredItems = navItemsForRole(user?.role)

  function getBadgeCount(href: string): number | undefined {
    if (href === "/requests" && myPendingCount > 0) return myPendingCount
    if (href === "/approvals" && approvalsCount > 0) return approvalsCount
    return undefined
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        aria-label="Main navigation"
        className={cn(
          "hidden md:flex flex-col sticky top-0 h-screen shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-[248px]",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center h-16 px-4 border-b border-sidebar-border shrink-0",
            collapsed ? "justify-center" : "gap-2.5",
          )}
        >
          {collapsed ? (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shadow-sm shadow-primary/25">
              <Wallet className="w-4 h-4 text-primary-foreground" />
            </div>
          ) : (
            <Logo size="md" />
          )}
        </div>

        {/* Nav Items */}
        <nav aria-label="Pages" className="flex-1 py-3 px-2.5 flex flex-col gap-0.5 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive = isNavActive(pathname, item.href)
            const badge = item.badge ? getBadgeCount(item.href) : undefined
            const Icon = item.icon

            const linkContent = (
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-2.5",
                )}
              >
                <Icon className={cn("w-[18px] h-[18px] shrink-0", isActive && "text-primary")} />
                {!collapsed && <span>{item.label}</span>}
                {badge !== undefined && (
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold",
                      collapsed
                        ? "absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px]"
                        : "ml-auto min-w-[22px] h-[22px] text-[11px] px-1.5",
                    )}
                  >
                    {badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                )}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                    {badge !== undefined && ` (${badge})`}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{linkContent}</div>
          })}
        </nav>

        {/* Account + collapse */}
        <div className="p-2.5 border-t border-sidebar-border flex flex-col gap-2 shrink-0">
          {user &&
            (collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    aria-label={`Log out ${user.full_name} (${roleLabel})`}
                    className="mx-auto flex items-center justify-center w-10 h-10 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 transition-colors"
                  >
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className={cn("text-[11px] font-bold", roleAvatarColors[user.role])}>
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {user.full_name} · {roleLabel} — click to log out
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="rounded-xl border border-sidebar-border/60 bg-sidebar-accent/30 p-2.5 flex flex-col gap-2">
                <SignedInAs compact className="[&_p]:text-sidebar-foreground [&_p.text-muted-foreground]:text-sidebar-foreground/80 [&_p:first-child]:text-sidebar-foreground/70" />
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="flex items-center justify-center gap-2 h-8 rounded-lg text-xs font-semibold text-sidebar-foreground/80 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log out
                </button>
              </div>
            ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!collapsed}
                className={cn(
                  "flex items-center justify-center rounded-xl border border-sidebar-border/60 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 hover:border-sidebar-accent/40 active:scale-95 transition-all duration-200",
                  collapsed ? "w-10 h-10 mx-auto" : "w-full h-9",
                )}
              >
                {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? "right" : "top"} className="font-medium">
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
          {!collapsed && (
            <p className="text-[10px] text-sidebar-foreground/80 text-center pb-1">
              Developed by <a href="https://www.gydgen.com" target="_blank" rel="noopener noreferrer" className="font-medium text-sidebar-foreground/85 hover:text-sidebar-primary transition-colors">GydGen</a>
            </p>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
