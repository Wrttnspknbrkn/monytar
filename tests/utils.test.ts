import { describe, it, expect } from "vitest"
import {
  cn,
  formatCurrency,
  formatDate,
  isOverdue,
  getStatusColor,
  getPriorityColor,
  getCategoryLabel,
  getRoleLabel,
  getInitials,
  generateId,
} from "@/lib/utils"

describe("cn", () => {
  it("merges conditional classes", () => {
    expect(cn("p-2", false && "hidden", "text-sm")).toBe("p-2 text-sm")
  })
  it("dedupes conflicting tailwind classes (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
  })
})

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50")
  })
  it("respects an explicit currency", () => {
    // Non-breaking space separates symbol in some ICU builds; assert on digits.
    expect(formatCurrency(1000, "EUR")).toContain("1,000.00")
  })
  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("$0.00")
  })
})

describe("formatDate", () => {
  it("formats an ISO date", () => {
    expect(formatDate("2025-01-15")).toBe("Jan 15, 2025")
  })
})

describe("isOverdue", () => {
  it("returns false when no date is provided", () => {
    expect(isOverdue(undefined)).toBe(false)
  })
  it("returns true for a past date", () => {
    expect(isOverdue("2000-01-01")).toBe(true)
  })
  it("returns false for a far-future date", () => {
    expect(isOverdue("2999-01-01")).toBe(false)
  })
})

describe("label + color maps", () => {
  it("returns a class string for every status", () => {
    for (const s of ["draft", "pending", "approved", "rejected", "paid", "cancelled"] as const) {
      expect(getStatusColor(s)).toBeTruthy()
    }
  })
  it("returns a class string for every priority", () => {
    for (const p of ["low", "medium", "high", "urgent"] as const) {
      expect(getPriorityColor(p)).toBeTruthy()
    }
  })
  it("maps category and role labels", () => {
    expect(getCategoryLabel("software")).toBe("Software & Services")
    expect(getRoleLabel("finance")).toBe("Finance")
  })
})

describe("getInitials", () => {
  it("takes the first two initials, uppercased", () => {
    expect(getInitials("ama mensah")).toBe("AM")
  })
  it("caps at two characters for long names", () => {
    expect(getInitials("Kwame Nkrumah Owusu")).toBe("KN")
  })
})

describe("generateId", () => {
  it("produces unique-ish ids", () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateId()))
    expect(ids.size).toBe(200)
  })
})
