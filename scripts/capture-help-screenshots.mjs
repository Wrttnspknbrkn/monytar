// Regenerates the annotated screenshots used by the in-app Help page (public/images/help/*.png).
//
//   1. Start the app:            pnpm dev            (http://localhost:3000)
//   2. Run this script:          node scripts/capture-help-screenshots.mjs
//
// It seeds a throwaway demo organization in the Supabase project from .env.local
// (needs SUPABASE_SERVICE_ROLE_KEY), signs in as each role in your installed Google
// Chrome, draws numbered markers on the real screens, saves them, and deletes every
// row and user it created. Re-run it whenever the UI changes so the guide never
// shows an outdated screen.
import fs from "fs"
import path from "path"
import { chromium } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"

const BASE = process.env.HELP_BASE_URL || "http://localhost:3000"
const OUT = path.join(process.cwd(), "public", "images", "help")
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => {
    const i = l.indexOf("=")
    return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")]
  }),
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
fs.mkdirSync(OUT, { recursive: true })

const PASSWORD = "Help!" + Math.random().toString(36).slice(2, 10) + "9"
const stamp = Date.now()
const created = { orgId: null, userIds: [] }

// ---------------------------------------------------------------- seed
async function seed() {
  const org = (await sb.from("organizations").insert({ name: "Northwind Studio", slug: "help-shots-" + stamp }).select().single()).data
  created.orgId = org.id
  await sb.from("organization_settings").insert({
    organization_id: org.id, default_currency: "GHS", auto_approve_under_amount: 50,
    receipt_required_above_amount: 100, require_receipts: true, approval_threshold_amount: 2000,
    require_manager_approval: true, require_finance_approval: true,
  })
  const ops = (await sb.from("departments").insert({ organization_id: org.id, name: "Operations", budget_amount: 20000, budget_period: "monthly" }).select().single()).data
  await sb.from("departments").insert({ organization_id: org.id, name: "Sales", budget_amount: 12000, budget_period: "monthly" })

  const people = [
    ["employee", "Ama Mensah", ops.id], ["employee", "Yaw Darko", ops.id], ["manager", "Kwame Boateng", ops.id],
    ["finance", "Efua Owusu", null], ["admin", "Kofi Adjei", ops.id],
  ]
  const users = {}
  for (const [role, name, dept] of people) {
    const email = `${name.toLowerCase().replace(" ", ".")}@northwind.example`
    const { data, error } = await sb.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: name } })
    if (error) throw error
    created.userIds.push(data.user.id)
    await sb.from("users").upsert({ id: data.user.id, organization_id: org.id, full_name: name, email, role, department_id: dept })
    users[name.split(" ")[0]] = { id: data.user.id, email, role }
  }
  await sb.from("departments").update({ manager_id: users.Kwame.id }).eq("id", ops.id)

  const vend = {}
  for (const v of ["Shell Fuel Station", "Vodafone Ghana", "Melcom", "Bolt"]) {
    vend[v] = (await sb.from("vendors").insert({ organization_id: org.id, name: v, is_approved: true }).select().single()).data.id
  }
  const yr = new Date().getFullYear()
  let n = 11
  const mk = async (who, over) => {
    const row = (await sb.from("expense_requests").insert({
      organization_id: org.id, request_number: `REQ-${yr}-${String(n++).padStart(5, "0")}`, employee_id: users[who].id,
      department_id: ops.id, currency: "GHS", priority: "medium", payment_status: "unpaid",
      expense_date: new Date().toISOString(), ...over,
    }).select().single()).data
    return row
  }
  const R = {}
  R.pending = await mk("Ama", { purpose: "Fuel for the client visit in Kumasi", amount: 180, category: "travel", status: "pending", vendor_id: vend["Shell Fuel Station"], submitted_at: new Date().toISOString() })
  R.approved = await mk("Ama", { purpose: "Team lunch after the product launch", amount: 320, category: "meals", status: "approved", approved_at: new Date().toISOString(), approved_by: users.Kwame.id, submitted_at: new Date().toISOString(), vendor_id: vend["Melcom"] })
  R.rejected = await mk("Ama", { purpose: "Domain renewal for the website", amount: 95, category: "software", status: "rejected", manager_comment: "Please attach the invoice showing the renewal period.", rejected_at: new Date().toISOString(), rejected_by: users.Kwame.id, submitted_at: new Date().toISOString(), vendor_id: vend["Vodafone Ghana"] })
  R.draft = await mk("Ama", { purpose: "Printer paper and toner", amount: 60, category: "supplies", status: "draft" })
  R.paid = await mk("Ama", { purpose: "Taxi to the airport", amount: 140, category: "travel", status: "paid", payment_status: "paid", payment_method: "bank_transfer", payment_reference: "TXN-48213", payment_date: new Date().toISOString(), approved_at: new Date().toISOString(), approved_by: users.Kwame.id, submitted_at: new Date().toISOString(), vendor_id: vend["Bolt"] })
  R.yaw1 = await mk("Yaw", { purpose: "Client dinner at Osu", amount: 450, category: "meals", status: "pending", submitted_at: new Date().toISOString() })
  R.yaw2 = await mk("Yaw", { purpose: "Mobile data bundle for field work", amount: 120, category: "other", status: "pending", submitted_at: new Date().toISOString(), vendor_id: vend["Vodafone Ghana"] })
  return { users, R }
}

async function cleanup() {
  if (!created.orgId) return
  const org = created.orgId
  for (const t of ["notifications", "expense_requests", "vendors"]) await sb.from(t).delete().eq("organization_id", org)
  await sb.from("request_number_counters").delete().eq("organization_id", org)
  await sb.from("users").update({ department_id: null }).eq("organization_id", org)
  await sb.from("departments").delete().eq("organization_id", org)
  await sb.from("organization_settings").delete().eq("organization_id", org)
  for (const id of created.userIds) await sb.auth.admin.deleteUser(id)
  await sb.from("organizations").delete().eq("id", org)
}

// Where each numbered marker sits on each screenshot, so the Help page can spotlight the
// exact spot for the step being read. Written to components/help/markers.json.
const manifest = {}
let lastMarks = []

// ---------------------------------------------------------------- browser helpers
async function login(browser, email) {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.goto(BASE + "/login")
  await page.fill("#email", email)
  await page.fill("#password", PASSWORD)
  await page.click("button[type=submit]")
  await page.waitForURL("**/dashboard", { timeout: 60000 })
  return { ctx, page }
}

/** Draws an accent outline + numbered badge over each target, then returns. */
async function mark(page, targets) {
  const boxes = []
  for (const [i, t] of targets.entries()) {
    const loc = typeof t === "string" ? page.locator(t).first() : t.first()
    await loc.waitFor({ state: "visible", timeout: 20000 })
    const b = await loc.boundingBox()
    if (!b) throw new Error("no box for target " + i)
    boxes.push({ n: i + 1, ...b })
  }
  lastMarks = boxes
  await page.evaluate((boxes) => {
    for (const b of boxes) {
      const ring = document.createElement("div")
      ring.style.cssText = `position:fixed;left:${b.x - 4}px;top:${b.y - 4}px;width:${b.width + 8}px;height:${b.height + 8}px;border:2.5px solid #2f5fdc;border-radius:10px;box-shadow:0 0 0 4px rgba(47,95,220,.18);pointer-events:none;z-index:2147483646`
      const dot = document.createElement("div")
      dot.textContent = String(b.n)
      dot.style.cssText = `position:fixed;left:${Math.max(4, b.x + b.width - 14)}px;top:${Math.max(4, b.y - 18)}px;width:28px;height:28px;border-radius:50%;background:#2f5fdc;color:#fff;font:800 14px/28px system-ui,sans-serif;text-align:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);pointer-events:none;z-index:2147483647`
      document.body.append(ring, dot)
    }
  }, boxes)
}

async function shot(page, name, opts = {}) {
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, name + ".png"), ...opts })
  const vp = page.viewportSize()
  manifest[name] = {
    width: vp.width,
    height: vp.height,
    markers: lastMarks.map((b) => ({ n: b.n, x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) })),
  }
  console.log("saved", name)
}

const settle = (page) => page.waitForLoadState("networkidle").catch(() => {})

// ---------------------------------------------------------------- main
const seeded = await seed().catch(async (e) => { await cleanup(); throw e })
const { users, R } = seeded
const browser = await chromium.launch({ channel: "chrome", headless: true })
try {
  // 1. Employee: menu + identity
  {
    const { ctx, page } = await login(browser, users.Ama.email)
    await page.goto(BASE + "/dashboard"); await settle(page); await page.waitForSelector("text=Welcome back")
    await mark(page, [page.locator("aside nav[aria-label='Pages']"), page.locator("aside >> text=Signed in as").locator(".."), page.getByRole("link", { name: "New Request" })])
    await shot(page, "nav-identity")

    // 2. requests list
    await page.goto(BASE + "/requests"); await settle(page); await page.waitForSelector("text=My Requests")
    await mark(page, [page.getByRole("tablist"), page.getByLabel("Search requests"), page.getByRole("link", { name: "New request" }).first()])
    await shot(page, "requests-list")

    // 3. new request form (tall viewport)
    await page.setViewportSize({ width: 1200, height: 1400 })
    await page.goto(BASE + "/requests/new"); await settle(page); await page.waitForSelector("#amount")
    await page.fill("#amount", "180")
    await page.fill("#purpose", "Fuel for the client visit in Kumasi")
    await mark(page, [page.locator("#amount"), page.locator("#category"), page.locator("#purpose"), page.getByText("Click to upload receipts").locator(".."), page.getByRole("button", { name: "Submit for Approval" })])
    await shot(page, "new-request")
    await page.setViewportSize({ width: 1200, height: 760 })

    // 4. rejected request detail
    await page.goto(`${BASE}/requests/${R.rejected.id}`); await settle(page); await page.waitForSelector("text=Reviewer Comment")
    await mark(page, [page.getByText("Rejected", { exact: true }).first(), page.getByText("Reviewer Comment").locator("../.."), page.getByRole("button", { name: "Resubmit" })])
    await shot(page, "rejected-request")
    await ctx.close()
  }

  // 5. Manager approvals
  {
    const { ctx, page } = await login(browser, users.Kwame.email)
    await page.goto(BASE + "/approvals"); await settle(page); await page.waitForSelector("text=awaiting your review")
    await mark(page, [page.getByLabel("Search pending requests"), page.getByRole("button", { name: "Approve" }).first(), page.getByRole("button", { name: "Reject" }).first(), page.getByRole("button", { name: "View Details" }).first()])
    await shot(page, "approvals")
    await ctx.close()
  }

  // 6 + 7. Finance: process payment + reports
  {
    const { ctx, page } = await login(browser, users.Efua.email)
    await page.goto(`${BASE}/requests/${R.approved.id}`); await settle(page)
    await page.getByRole("button", { name: "Process Payment" }).click()
    await page.getByPlaceholder("e.g. TXN-12345").fill("TXN-48214")
    await mark(page, [page.getByPlaceholder("e.g. TXN-12345"), page.getByRole("dialog").getByRole("combobox"), page.getByRole("button", { name: "Confirm Payment" })])
    await shot(page, "process-payment")
    await page.goto(BASE + "/reports"); await settle(page); await page.waitForSelector("text=Total Submitted")
    await mark(page, [page.getByRole("combobox").first(), page.getByRole("button", { name: "Export" }), page.getByRole("tablist")])
    await shot(page, "reports")
    await ctx.close()
  }

  // 8 + 9 + 10. Admin: departments, invite, workflow settings
  {
    const { ctx, page } = await login(browser, users.Kofi.email)
    await page.goto(BASE + "/departments"); await settle(page); await page.waitForSelector("text=Budget (monthly)")
    await mark(page, [page.getByRole("button", { name: "Add department" }), page.getByText("Budget (monthly)").first().locator("../.."), page.getByRole("button", { name: "Members" }).first()])
    await shot(page, "departments")

    await page.goto(BASE + "/users"); await settle(page); await page.waitForSelector("text=Invite user")
    await page.getByRole("button", { name: "Invite user" }).click()
    await page.fill("#invite-email", "new.teammate@company.com")
    await mark(page, [page.locator("#invite-email"), page.locator("#invite-role"), page.locator("#invite-department"), page.getByRole("button", { name: "Send invitation" })])
    await shot(page, "invite-user")

    await page.setViewportSize({ width: 1200, height: 1020 })
    await page.goto(BASE + "/settings"); await settle(page)
    await page.getByRole("tab", { name: "Organization" }).click()
    await page.getByText("Approval Workflow").first().scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, 40))
    await mark(page, [page.getByText("Auto-approve under").locator(".."), page.getByText("Receipt required above").locator(".."), page.getByText("Finance review above").locator(".."), page.getByRole("button", { name: "Save Changes" }).last()])
    await shot(page, "approval-rules")
    await ctx.close()
  }
  fs.writeFileSync(path.join(process.cwd(), "components", "help", "markers.json"), JSON.stringify(manifest, null, 2) + "\n")
  console.log("wrote markers.json")
} finally {
  await browser.close()
  await cleanup()
  console.log("cleaned up demo data")
}
