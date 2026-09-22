import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// supabase-js runs onAuthStateChange callbacks while holding its auth lock, and
// every query needs that lock via getSession(). An async callback that awaits a
// query therefore deadlocks (hard refresh hangs until the 10s timeouts fire).
describe("auth provider", () => {
  const src = readFileSync(join(__dirname, "..", "lib", "providers", "auth-provider.tsx"), "utf8")

  it("does not pass an async callback to onAuthStateChange", () => {
    expect(src).toMatch(/onAuthStateChange\(\s*\(event, session\) =>/)
    expect(src).not.toMatch(/onAuthStateChange\(\s*async/)
  })

  it("defers network work out of the callback", () => {
    const start = src.indexOf("onAuthStateChange(")
    const body = src.slice(start, src.indexOf("subscription.unsubscribe()", start))
    expect(body).toContain("setTimeout(")
  })
})
