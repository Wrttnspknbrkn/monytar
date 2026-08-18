import { test, expect } from "@playwright/test"

/**
 * Marketing-claim reconciliation guardrails.
 *
 * These assert that the public pages render AND that the specific claims we
 * removed during Phase 7.3 stay gone, so a future edit can't silently
 * reintroduce a promise the product doesn't keep.
 */

test.describe("landing page", () => {
  test("renders hero and truthful trust strip", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/Monytar/i)
    // Reconciled capability badges replaced the fabricated "500+ finance teams".
    await expect(page.getByText("Role-based approvals").first()).toBeVisible()
    await expect(page.getByText(/Built on a modern, secure stack/i)).toBeVisible()
  })

  test("does not claim fabricated social proof", async ({ page }) => {
    await page.goto("/")
    const body = await page.locator("body").innerText()
    expect(body).not.toMatch(/Trusted by\s+500\+/i)
    expect(body).not.toMatch(/Average user rating/i)
    expect(body).not.toMatch(/Trusted by teams at/i)
  })
})

test.describe("pricing page", () => {
  test("advertises the 14-day no-card trial", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    const body = await page.locator("body").innerText()
    expect(body).toMatch(/14-day free trial/i)
    expect(body).toMatch(/No credit card required/i)
  })

  test("does not assert SOC 2 compliance for Monytar itself", async ({ page }) => {
    await page.goto("/pricing")
    const body = await page.locator("body").innerText()
    expect(body).not.toMatch(/maintain SOC 2 Type II compliance/i)
  })
})

test.describe("features page", () => {
  test("renders reconciled capability lists", async ({ page }) => {
    await page.goto("/features")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    const body = await page.locator("body").innerText()
    // Real, shipped capabilities.
    expect(body).toMatch(/Row-level security/i)
    // Removed aspirational claims.
    expect(body).not.toMatch(/Camera receipt capture/i)
    expect(body).not.toMatch(/Offline draft support/i)
    expect(body).not.toMatch(/SOC 2 Type II ready/i)
    expect(body).not.toMatch(/Bulk expense upload via CSV/i)
  })
})

test.describe("security page", () => {
  test("marks 2FA and SSO as roadmap, not shipped", async ({ page }) => {
    await page.goto("/security")
    const body = await page.locator("body").innerText()
    expect(body).toMatch(/Row Level Security/i)
    expect(body).toMatch(/roadmap/i)
    expect(body).not.toMatch(/penetration testing performed quarterly/i)
  })
})
