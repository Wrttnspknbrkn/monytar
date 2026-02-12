"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, CheckSquare, Store, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"

export function MobileNav() {
  const pathname = usePathname()
  const { currentUser, getPendingApprovals } = useStore()
  const approvalsCount = getPendingApprovals().length
  const showApprovals = currentUser.role !== "employee"

  const items = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/requests", label: "Requests", icon: FileText },
    ...(showApprovals ? [{ href: "/approvals", label: "Approvals", icon: CheckSquare, badge: approvalsCount }] : []),
    { href: "/vendors", label: "Vendors", icon: Store },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 text-xs relative",
                isActive ? "text-primary font-medium" : "text-muted-foreground",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {"badge" in item && item.badge && item.badge > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
