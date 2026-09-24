import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { FAQS, GLOSSARY, JOURNEY, REJECTED_INFO, ROLE_TAGLINE, TASKS } from "@/components/help/guide-data"
import * as content from "@/components/handbook/handbook-content"

/**
 * The handbook is shared outside the company. It may only say what a person
 * using the product can already see: no technology, vendors, infrastructure,
 * security design, internal numbers, customer names or real contact details.
 */

const BANNED = [
  "supabase", "stripe", "resend", "upstash", "sentry", "vercel", "next.js", "nextjs", "react", "postgres", "redis",
  "tailwind", "typescript", "github", "webhook", "api key", "apikey", "secret", "token", "jwt", "rls", "row level",
  "database", "schema", "migration", "endpoint", "server", "encrypt", "hash", "cors", "rate limit", "rate-limit",
  "env", "localhost", "internal", "confidential", "roadmap", "revenue", "valuation", "investor", "competitor",
  "gydgen", "service_role", "anon key", "sql", "cron",
]

function texts(): string[] {
  const out: string[] = []
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v)
    else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === "object") Object.values(v as Record<string, unknown>).forEach(walk)
  }
  // Icons are functions/objects; strip them by only walking plain data.
  const plain = (x: unknown): unknown => JSON.parse(JSON.stringify(x, (k, val) => (k === "icon" || typeof val === "function" ? undefined : val)))
  walk(plain(content))
  walk(plain({ TASKS, JOURNEY, REJECTED_INFO, FAQS, GLOSSARY, ROLE_TAGLINE }))
  return out
}

describe("handbook is safe to share", () => {
  const all = texts()
  const haystack = all.join("\n").toLowerCase()

  it("collects real copy to scan", () => {
    expect(all.length).toBeGreaterThan(80)
  })

  it.each(BANNED)("never mentions %s", (term) => {
    const re = new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i")
    expect(haystack, `banned term "${term}" found in handbook copy`).not.toMatch(re)
  })

  it("contains no email addresses, phone numbers or links", () => {
    expect(haystack).not.toMatch(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)
    expect(haystack).not.toMatch(/\+?\d[\d\s().-]{8,}\d/)
    expect(haystack).not.toMatch(/https?:\/\//)
  })

  it("the source files do not import server code or read environment variables", () => {
    const src = ["components/handbook/handbook.tsx", "components/handbook/print-handbook.tsx", "components/handbook/handbook-content.ts", "app/handbook/page.tsx"]
      .map((f) => readFileSync(join(process.cwd(), f), "utf8"))
      .join("\n")
    expect(src).not.toMatch(/process\.env/)
    expect(src).not.toMatch(/@\/lib\/supabase|@\/lib\/stripe|@\/app\/api/)
  })
})
