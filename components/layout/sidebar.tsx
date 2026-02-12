"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Store,
  Building2,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["employee", "manager", "finance", "admin"] },
  { href: "/requests", label: "Requests", icon: FileText, roles: ["employee", "manager", "finance", "admin"], badge: true },
  { href: "/approvals", label: "Approvals", icon: CheckSquare, roles: ["manager", "finance", "admin"], badge: true },
  { href: "/vendors", label: "Vendors", icon: Store, roles: ["employee", "manager", "finance", "admin"] },
  { href: "/departments", label: "Departments", icon: Building2, roles: ["manager", "finance", "admin"] },
  { href: "/users", label: "Users", icon: Users, roles: ["admin"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["finance", "admin"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["employee", "manager", "finance", "admin"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { currentUser, getMyRequests, getPendingApprovals } = useStore()
  const [collapsed, setCollapsed] = useState(false)

  const myPendingCount = getMyRequests().filter((r) => r.status === "pending").length
  const approvalsCount = getPendingApprovals().length

  const filteredItems = navItems.filter((item) => item.roles.includes(currentUser.role))

  function getBadgeCount(href: string): number | undefined {
    if (href === "/requests" && myPendingCount > 0) return myPendingCount
    if (href === "/approvals" && approvalsCount > 0) return approvalsCount
    return undefined
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-[248px]",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center h-16 px-4 border-b border-sidebar-border",
            collapsed ? "justify-center" : "gap-2.5",
          )}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shadow-sm shadow-primary/25">
            <Wallet className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-heading font-bold tracking-tight text-sidebar-accent-foreground">
              SpendFlow
            </span>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-3 px-2.5 flex flex-col gap-0.5 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const badge = item.badge ? getBadgeCount(item.href) : undefined
            const Icon = item.icon

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 relative group",
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

        {/* Collapse + footer */}
        <div className="p-2.5 border-t border-sidebar-border flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 h-9"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="ml-2 text-xs font-medium">Collapse</span>}
          </Button>
          {!collapsed && (
            <p className="text-[10px] text-sidebar-foreground/40 text-center pb-1">
              Developed by <span className="font-medium text-sidebar-foreground/60">GydGen</span>
            </p>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
