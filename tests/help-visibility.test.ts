import { describe, it, expect } from "vitest"
import { TASKS, VISIBLE_ROLES, tasksForRole, canViewTask } from "@/components/help/guide-data"
import type { UserRole } from "@/lib/types"

const ids = (role: UserRole) => tasksForRole(role).map((t) => t.id)
const task = (id: string) => TASKS.find((t) => t.id === id)!

describe("who can read which guide", () => {
  it("employee sees only the employee guide; admin sees every role's", () => {
    expect(VISIBLE_ROLES.employee).toEqual(["employee"])
    expect(VISIBLE_ROLES.admin).toEqual(["employee", "manager", "finance", "admin"])
  })

  it("manager sees employee + manager, nothing above", () => {
    expect(VISIBLE_ROLES.manager).toEqual(["employee", "manager"])
    expect(VISIBLE_ROLES.manager).not.toContain("finance")
    expect(VISIBLE_ROLES.manager).not.toContain("admin")
  })

  it("never lets a role see a role above it", () => {
    const order: UserRole[] = ["employee", "manager", "finance", "admin"]
    for (const viewer of order) {
      for (const seen of VISIBLE_ROLES[viewer]) {
        expect(order.indexOf(seen)).toBeLessThanOrEqual(order.indexOf(viewer))
      }
    }
  })
})

describe("task access", () => {
  it("an employee cannot open manager, finance or admin walkthroughs (e.g. via ?task=)", () => {
    for (const id of ["approve", "pay", "reports", "budgets", "invite", "rules"]) {
      expect(canViewTask("employee", task(id))).toBe(false)
    }
    for (const id of ["add-expense", "track-expenses", "fix-rejected", "find-way"]) {
      expect(canViewTask("employee", task(id))).toBe(true)
    }
  })

  it("a manager can approve and see budgets but not pay, run reports, invite or set rules", () => {
    expect(canViewTask("manager", task("approve"))).toBe(true)
    expect(canViewTask("manager", task("budgets"))).toBe(true)
    for (const id of ["pay", "reports", "invite", "rules"]) expect(canViewTask("manager", task(id))).toBe(false)
  })

  it("finance cannot open admin-only walkthroughs; admin can open everything", () => {
    expect(canViewTask("finance", task("invite"))).toBe(false)
    expect(canViewTask("finance", task("pay"))).toBe(true)
    for (const t of TASKS) expect(canViewTask("admin", t)).toBe(true)
  })

  it("each role's tile list matches what that role can do", () => {
    expect(ids("employee")).toEqual(["add-expense", "track-expenses", "fix-rejected", "find-way"])
    expect(ids("admin")).toHaveLength(TASKS.length)
  })
})
