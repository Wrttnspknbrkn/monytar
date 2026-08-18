import { defineConfig, devices } from "@playwright/test"

/**
 * E2E configuration for Monytar.
 *
 * These tests run against the app in DEMO mode (no Supabase env vars), which
 * makes the dashboard reachable without real auth and seeds it with mock data.
 *
 * The dev server is expected to already be running on BASE_URL. In CI, start it
 * before this suite (e.g. `pnpm dev &` with Supabase env unset) — see
 * docs/OPERATIONS.md. We intentionally do NOT let Playwright spawn its own
 * server to avoid colliding with an existing dev server on the same port.
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
})
