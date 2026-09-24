// Regenerates the "Getting started" screenshots used by the handbook (public/images/help/start-*.png)
// and their marker positions (components/handbook/start-markers.json).
//
//   1. Start the app:            pnpm dev            (http://localhost:3000)
//   2. Run this script:          node scripts/capture-handbook-start.mjs
//
// The real sign-up and invitation pages are opened in your installed Google Chrome. The two
// server calls they make are answered with pretend responses, so NOTHING is created anywhere:
// no account, no organization, no email. The people and company shown are made up.
import fs from "fs"
import path from "path"
import { chromium } from "@playwright/test"

const BASE = process.env.HELP_BASE_URL || "http://localhost:3000"
const OUT = path.join(process.cwd(), "public", "images", "help")
const manifest = {}

const SAMPLE = { name: "Ama Mensah", email: "ama@northwind.example", password: "SamplePass123", org: "Northwind Trading", size: "10-50" }

/** Outline + numbered badge over each target. Returns their boxes. */
async function mark(page, targets) {
  const boxes = []
  for (const [i, t] of targets.entries()) {
    const loc = typeof t === "string" ? page.locator(t).first() : t.first()
    await loc.waitFor({ state: "visible", timeout: 20000 })
    const b = await loc.boundingBox()
    if (!b) throw new Error("no box for target " + i)
    boxes.push({ n: i + 1, ...b })
  }
  await page.evaluate((boxes) => {
    for (const b of boxes) {
      const ring = document.createElement("div")
      ring.style.cssText = `position:fixed;left:${b.x - 4}px;top:${b.y - 4}px;width:${b.width + 8}px;height:${b.height + 8}px;border:2.5px solid #2f5fdc;border-radius:10px;box-shadow:0 0 0 4px rgba(47,95,220,.18);pointer-events:none;z-index:2147483646`
      const dot = document.createElement("div")
      dot.textContent = String(b.n)
      dot.style.cssText = `position:fixed;left:${b.x + b.width - 14}px;top:${b.y - 18}px;width:28px;height:28px;border-radius:50%;background:#2f5fdc;color:#fff;font:800 14px/28px system-ui,sans-serif;text-align:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);pointer-events:none;z-index:2147483647`
      document.body.append(ring, dot)
    }
  }, boxes)
  return boxes
}

/** Screenshot of `area`, with marker positions stored relative to it. */
async function shot(page, name, area, targets) {
  await page.addStyleTag({ content: "nextjs-portal,[data-sonner-toaster]{display:none!important}" })
  await page.evaluate(() => document.activeElement && document.activeElement.blur())
  await page.waitForTimeout(500)
  const boxes = await mark(page, targets)
  await page.waitForTimeout(150)
  // Crop to the form with a little breathing room.
  const box = await page.locator(area).first().boundingBox()
  const pad = 32
  const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 }
  await page.screenshot({ path: path.join(OUT, name + ".png"), clip })
  manifest[name] = {
    width: Math.round(clip.width),
    height: Math.round(clip.height),
    markers: boxes.map((b) => ({ n: b.n, x: Math.round(b.x - clip.x), y: Math.round(b.y - clip.y), w: Math.round(b.width), h: Math.round(b.height) })),
  }
  await page.evaluate(() => document.querySelectorAll("[style*='2147483646'], [style*='2147483647']").forEach((e) => e.remove()))
  console.log("saved", name, manifest[name].width + "x" + manifest[name].height)
}

const browser = await chromium.launch({ channel: "chrome", headless: true })
try {
  // ---- Creating a company account (4 steps) -------------------------------------------
  {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 820 }, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    // Pretend the account was created and an email confirmation is pending.
    await page.route("**/api/auth/signup", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ signedIn: false, organization: { id: "sample" } }) }))
    await page.goto(BASE + "/signup", { waitUntil: "networkidle" })
    const panel = "div.flex-1.min-w-0 > div.w-full.max-w-sm"
    const cont = page.getByRole("button", { name: /^Continue/ })

    await page.fill("#fullName", SAMPLE.name)
    await page.fill("#signupEmail", SAMPLE.email)
    await page.fill("#signupPassword", SAMPLE.password)
    await shot(page, "start-signup-account", panel, [page.locator("form, div.flex.flex-col.gap-4").filter({ has: page.locator("#fullName") }).last(), cont])

    await cont.click()
    await page.fill("#orgName", SAMPLE.org)
    await page.fill("#orgSize", SAMPLE.size)
    await shot(page, "start-signup-org", panel, [page.locator("#orgName").locator("xpath=ancestor::div[1]"), page.locator("#orgSize").locator("xpath=ancestor::div[1]")])

    await cont.click()
    await page.getByText("Choose Plan").first().waitFor()
    await shot(page, "start-signup-plan", panel, [page.locator("button", { hasText: "Free" }).first(), cont])

    await cont.click()
    await page.getByText("Check your email").first().waitFor()
    await shot(page, "start-signup-email", panel, [page.getByRole("heading", { name: "Check your email" }).locator("xpath=..")])
    await ctx.close()
  }

  // ---- Joining through an invitation ---------------------------------------------------
  {
    const ctx = await browser.newContext({ viewport: { width: 600, height: 720 }, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    await page.route(
      (u) => u.pathname === "/api/auth/accept-invitation",
      (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ organizationName: SAMPLE.org, role: "employee", email: SAMPLE.email }) }),
    )
    await page.goto(BASE + "/accept-invitation?token=sample", { waitUntil: "networkidle" })
    await page.getByRole("heading", { name: /^Join / }).waitFor()
    await page.fill("#fullName", SAMPLE.name)
    await page.fill("#password", SAMPLE.password)
    await shot(page, "start-invite-join", "div.w-full.max-w-sm", [
      page.getByRole("heading", { name: /^Join / }).locator("xpath=.."),
      page.locator("#fullName").locator("xpath=ancestor::div[contains(@class,'flex-col')][1]"),
      page.locator("#password").locator("xpath=ancestor::div[contains(@class,'flex-col')][1]"),
      page.getByRole("button", { name: /Accept invitation/ }),
    ])
    await ctx.close()
  }

  const file = path.join(process.cwd(), "components", "handbook", "start-markers.json")
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n")
  console.log("wrote start-markers.json")
} finally {
  await browser.close()
}
