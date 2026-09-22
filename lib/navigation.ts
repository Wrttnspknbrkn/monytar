import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Store,
  Building2,
  Users,
  BarChart3,
  Settings,
  Bell,
  type LucideIcon,
} from "lucide-react"
import type { UserRole } from "@/lib/types"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  roles: UserRole[]
  /** Whether this item can show a live count badge. */
  badge?: boolean
}

const ALL_ROLES: UserRole[] = ["employee", "manager", "finance", "admin"]

/**
 * Single source of truth for dashboard navigation. The desktop sidebar, the
 * mobile "More" menu and the search palette all read from here so a page is
 * never reachable from one and missing from another, and role gating can't
 * drift between them. Keep `roles` in step with each page's own access check.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
  { href: "/requests", label: "Requests", icon: FileText, roles: ALL_ROLES, badge: true },
  { href: "/approvals", label: "Approvals", icon: CheckSquare, roles: ["manager", "finance", "admin"], badge: true },
  { href: "/vendors", label: "Vendors", icon: Store, roles: ALL_ROLES },
  { href: "/departments", label: "Departments", icon: Building2, roles: ["manager", "finance", "admin"] },
  { href: "/users", label: "Users", icon: Users, roles: ["admin"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["finance", "admin"] },
  { href: "/notifications", label: "Notifications", icon: Bell, roles: ALL_ROLES },
  { href: "/settings", label: "Settings", icon: Settings, roles: ALL_ROLES },
]

/** Pages that live in the app but aren't top-level nav entries. */
const EXTRA_TITLES: Array<{ prefix: string; label: string }> = [
  { prefix: "/requests/new", label: "New Request" },
  { prefix: "/demo-leads", label: "Demo Leads" },
]

export function navItemsForRole(role: UserRole | undefined): NavItem[] {
  if (!role) return []
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Human title for the current route, used for the tab title and mobile header. */
export function pageTitleFor(pathname: string): string {
  const extra = EXTRA_TITLES.find((e) => pathname === e.prefix || pathname.startsWith(`${e.prefix}/`))
  if (extra) return extra.label
  if (/^\/requests\/[^/]+/.test(pathname)) return "Request Details"
  const item = NAV_ITEMS.find((i) => isNavActive(pathname, i.href))
  return item?.label ?? "Monytar"
}
