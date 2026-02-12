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
    <aside
      className={cn(
        "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-16 px-4 border-b border-sidebar-border", collapsed ? "justify-center" : "gap-2")}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
          <Wallet className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && <span className="text-lg font-semibold text-sidebar-accent-foreground">SpendFlow</span>}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
        {filteredItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const badge = item.badge ? getBadgeCount(item.href) : undefined
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors relative",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {badge !== undefined && (
                <span
                  className={cn(
                    "flex items-center justify-center min-w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium",
                    collapsed ? "absolute -top-1 -right-1 min-w-4 h-4 text-[10px]" : "ml-auto",
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse button */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </Button>
      </div>
    </aside>
  )
}
