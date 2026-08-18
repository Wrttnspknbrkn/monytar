import { defineConfig, devices } from "@playwright/test"

/**
 * E2E configuration for Monytar.
 *
 * These tests run against the app in DEMO mode (no Supabase env vars), which
 * makes the dashboard reachable without real auth and seeds it with mock data.
 * The dev server is started automatically via `webServer` below unless one is
 * already running on PORT (reused in local/CI to keep runs fast).
 */
const PORT = Number(process.env.PORT ?? 3000)
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
    // Ensure demo mode: unset Supabase config so the app seeds mock data.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    },
  },
})
