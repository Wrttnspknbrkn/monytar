import { describe, it, expect } from "vitest"
import { leadsToCsv, collectLeadContext } from "@/lib/demo/leads"
import type { DemoLead } from "@/lib/types"

function makeLead(overrides: Partial<DemoLead> = {}): DemoLead {
  return {
    id: "lead_1",
    full_name: "Ama Mensah",
    email: "ama@acme.com",
    company_name: "Acme Inc",
    phone: "+233201234567",
    entry_role: "finance",
    country: "Ghana",
    device: "Desktop",
    browser: "Chrome",
    referrer: "google.com",
    utm_campaign: "launch",
    converted: false,
    created_at: "2025-01-15T10:00:00.000Z",
    ...overrides,
  }
}

describe("leadsToCsv", () => {
  it("emits a header row plus one row per lead", () => {
    const csv = leadsToCsv([makeLead(), makeLead({ id: "lead_2" })])
    const lines = csv.split("\n")
    expect(lines.length).toBe(3)
    expect(lines[0]).toContain("Name")
    expect(lines[0]).toContain("Converted")
  })

  it("renders converted as Yes/No", () => {
    const csv = leadsToCsv([makeLead({ converted: true })])
    expect(csv.split("\n")[1]).toContain("Yes")
  })

  it("escapes values containing commas, quotes, and newlines", () => {
    const csv = leadsToCsv([
      makeLead({ full_name: 'Ama, "The Boss"', company_name: "Line1\nLine2" }),
    ])
    const row = csv.split("\n").slice(1).join("\n")
    // comma + quote field must be wrapped and quotes doubled
    expect(row).toContain('"Ama, ""The Boss"""')
    // newline field must be wrapped in quotes
    expect(row).toContain('"Line1\nLine2"')
  })

  it("handles missing optional fields without throwing", () => {
    const csv = leadsToCsv([
      makeLead({ company_name: undefined, phone: undefined, country: undefined, utm_campaign: undefined, utm_source: undefined }),
    ])
    expect(csv.split("\n").length).toBe(2)
  })
})

describe("collectLeadContext", () => {
  it("returns device, browser and referrer fields in a browser-like env", () => {
    const ctx = collectLeadContext()
    expect(ctx.device).toBeTruthy()
    expect(ctx.browser).toBeTruthy()
    expect(ctx.referrer).toBeTruthy()
  })
})
