import { test, expect, type Page } from "@playwright/test"

/**
 * Core interactive-demo journeys.
 *
 * Demo mode holds the active role in React state (no persistence), so these
 * tests drive the real click-through flow rather than deep-linking, which is
 * exactly how a prospect experiences the product.
 */

async function enterDemoAs(page: Page, roleTitle: string, name: string, email: string) {
  await page.goto("/demo")
  // Step 1 — pick a role card.
  await page.getByRole("button", { name: new RegExp(roleTitle, "i") }).first().click()
  // Step 2 — lead capture form.
  await expect(page.getByRole("heading", { name: new RegExp(`Start your ${roleTitle} demo`, "i") })).toBeVisible()
  await page.getByLabel("Full name").fill(name)
  await page.getByLabel("Work email").fill(email)
  await page.getByRole("button", { name: /Launch demo/i }).click()
  // Lands in the dashboard sandbox.
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible()
}

test("demo lead form validates required fields", async ({ page }) => {
  await page.goto("/demo")
  await page.getByRole("button", { name: /Employee/i }).first().click()
  // Submit with empty fields -> inline validation, no navigation.
  await page.getByRole("button", { name: /Launch demo/i }).click()
  await expect(page.getByText(/Please enter your name/i)).toBeVisible()
  await expect(page).toHaveURL(/\/demo/)
})

test("employee can enter the demo and reach the new-request form", async ({ page }) => {
  await enterDemoAs(page, "Employee", "Ama Mensah", "ama@company.com")

  // Navigate to the expense submission form (primary employee action).
  await page.goto("/requests/new")
  await expect(page.getByRole("heading", { name: /New Expense Request/i })).toBeVisible()
  await expect(page.getByPlaceholder("0.00")).toBeVisible()
  await expect(page.getByRole("button", { name: /Submit/i }).first()).toBeVisible()
})

test("manager can enter the demo and see the approvals queue", async ({ page }) => {
  await enterDemoAs(page, "Manager", "Kofi Boateng", "kofi@company.com")

  await page.goto("/approvals")
  await expect(page.getByRole("heading", { name: "Approvals", exact: true })).toBeVisible()
  await expect(page.getByPlaceholder(/Search pending requests/i)).toBeVisible()
})

test("finance can enter the demo and export a report", async ({ page }) => {
  await enterDemoAs(page, "Finance", "Nana Owusu", "nana@company.com")

  await page.goto("/reports")
  await expect(page.getByRole("heading", { name: /Reports/i }).first()).toBeVisible()
  // An export control should be present for finance users.
  await expect(page.getByRole("button", { name: /Export|CSV|PDF/i }).first()).toBeVisible()
})
