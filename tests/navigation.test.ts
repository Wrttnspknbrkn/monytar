import { describe, it, expect } from "vitest"
import { NAV_ITEMS, navItemsForRole, isNavActive, pageTitleFor } from "@/lib/navigation"
import type { UserRole } from "@/lib/types"

const ROLES: UserRole[] = ["employee", "manager", "finance", "admin"]

describe("navigation config", () => {
  it("gives every role a Dashboard, Requests, Notifications and Settings link", () => {
    for (const role of ROLES) {
      const hrefs = navItemsForRole(role).map((i) => i.href)
      expect(hrefs).toEqual(expect.arrayContaining(["/dashboard", "/requests", "/notifications", "/settings"]))
    }
  })

  it("only offers admin pages to admins", () => {
    expect(navItemsForRole("admin").map((i) => i.href)).toContain("/users")
    for (const role of ["employee", "manager", "finance"] as UserRole[]) {
      expect(navItemsForRole(role).map((i) => i.href)).not.toContain("/users")
    }
  })

  it("keeps approvals to approvers and reports to finance/admin (matches the page-level checks)", () => {
    expect(navItemsForRole("employee").map((i) => i.href)).not.toContain("/approvals")
    expect(navItemsForRole("manager").map((i) => i.href)).toContain("/approvals")
    expect(navItemsForRole("manager").map((i) => i.href)).not.toContain("/reports")
    expect(navItemsForRole("finance").map((i) => i.href)).toContain("/reports")
  })

  it("returns nothing (not everything) when the role is unknown", () => {
    expect(navItemsForRole(undefined)).toEqual([])
  })

  it("has unique hrefs and labels", () => {
    expect(new Set(NAV_ITEMS.map((i) => i.href)).size).toBe(NAV_ITEMS.length)
    expect(new Set(NAV_ITEMS.map((i) => i.label)).size).toBe(NAV_ITEMS.length)
  })
})

describe("isNavActive", () => {
  it("matches exact and nested paths but not look-alike prefixes", () => {
    expect(isNavActive("/requests", "/requests")).toBe(true)
    expect(isNavActive("/requests/abc", "/requests")).toBe(true)
    expect(isNavActive("/requests-archive", "/requests")).toBe(false)
    expect(isNavActive("/users", "/requests")).toBe(false)
  })
})

describe("pageTitleFor", () => {
  it("titles top-level, nested and unknown routes", () => {
    expect(pageTitleFor("/dashboard")).toBe("Dashboard")
    expect(pageTitleFor("/users")).toBe("Users")
    expect(pageTitleFor("/requests/new")).toBe("New Request")
    expect(pageTitleFor("/requests/3f2a")).toBe("Request Details")
    expect(pageTitleFor("/somewhere-else")).toBe("Monytar")
  })
})
