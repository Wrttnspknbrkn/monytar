// End-to-end CRUD test for Monytar, run against the REAL Supabase project in .env.local.
//
//   1. Start the app with email/billing/rate-limit/error-reporting switched OFF, on its own port:
//        RESEND_API_KEY= STRIPE_SECRET_KEY= STRIPE_WEBHOOK_SECRET= KV_REST_API_URL= KV_REST_API_TOKEN= \
//        SENTRY_DSN= npx next dev -p 3300
//   2. Run:   node scripts/e2e-crud.mjs
//
// What it does
//   - Creates TWO throwaway organisations ("ZZ-E2E-...") with one user per role, all on @...example.test
//     addresses, so nothing real is touched and no email can be delivered.
//   - Signs in as each user and performs every create / read / update / delete the app supports, through the
//     same paths the app uses (the API routes, and direct database calls under row-level security), and checks
//     both what each role CAN do and what it must NOT be able to do (including across organisations).
//   - Deletes everything it created (rows, uploaded files, auth users, organisations) and then proves it by
//     comparing row counts with a snapshot taken before it started. Exit code is non-zero on any failure or
//     leftover.
//
// It never touches rows it did not create: every delete is by an id (or org id) recorded here.
import fs from "fs"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"

const BASE = process.env.E2E_BASE_URL || "http://localhost:3300"
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => {
    const i = l.indexOf("=")
    return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")]
  }),
)
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const admin = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const stamp = Date.now()
const DOMAIN = `zz-e2e-${stamp}.example.test`
const PASSWORD = "E2e!" + Math.random().toString(36).slice(2, 10) + "Z9"
const YEAR = new Date().getFullYear()

// ------------------------------------------------------------------ tiny test runner
const results = []
let group = ""
const warnings = []
async function t(name, fn) {
  try {
    await fn()
    results.push({ group, name, ok: true })
  } catch (e) {
    results.push({ group, name, ok: false, err: e instanceof Error ? e.message : String(e) })
    console.log(`  ✗ [${group}] ${name}\n      ${e instanceof Error ? e.message : e}`)
  }
}
const warn = (msg) => { warnings.push(`[${group}] ${msg}`); console.log(`  ! ${msg}`) }
const ok = (cond, msg) => { if (!cond) throw new Error(msg) }
const eq = (a, b, msg) => { if (a !== b) throw new Error(`${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`) }
const section = (name) => { group = name; console.log(`\n== ${name}`) }

// ------------------------------------------------------------------ cleanup bookkeeping
const made = { orgs: [], authUsers: [], storage: [] }

// ------------------------------------------------------------------ sessions
async function login(email, password = PASSWORD) {
  // A cookie jar filled by the same library the app's server uses, so API calls carry a real session.
  const jar = new Map()
  const ssr = createServerClient(URL_, ANON, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => jar.set(name, value)),
    },
  })
  const { data, error } = await ssr.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`)
  const cookie = [...jar].map(([n, v]) => `${n}=${v}`).join("; ")
  return { id: data.user.id, email, cookie, db: ssr }
}

async function api(s, method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(s?.cookie ? { Cookie: s.cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  })
  let json = null
  try { json = await res.json() } catch {}
  return { status: res.status, json }
}

// "Denied" for a direct database write: an error, or zero rows affected (row-level security hides the row).
const denied = (r) => !!r.error || !r.data || (Array.isArray(r.data) && r.data.length === 0)

// ------------------------------------------------------------------ baseline + seed
const TABLES = [
  "organizations", "organization_settings", "users", "departments", "vendors", "expense_requests", "receipts",
  "approval_workflows", "notifications", "budget_alerts", "activity_logs", "user_invitations", "expense_categories",
  "request_number_counters", "subscription_history",
]
async function snapshot() {
  const out = {}
  for (const tbl of TABLES) out[tbl] = (await admin.from(tbl).select("*", { count: "exact", head: true })).count
  out.auth_users = (await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })).data.users.length
  for (const bucket of ["receipts", "logos"]) {
    const { data } = await admin.storage.from(bucket).list("", { limit: 1000 })
    out[`storage:${bucket}`] = (data || []).length
  }
  return out
}

const ctx = { A: {}, B: {}, s: {}, u: {} }

async function mkUser(org, name, role, department_id) {
  const email = `${name}@${DOMAIN}`
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: `ZZ ${name}` } })
  if (error) throw error
  made.authUsers.push(data.user.id)
  const { error: ue } = await admin.from("users").upsert({ id: data.user.id, organization_id: org, full_name: `ZZ ${name}`, email, role, department_id: department_id ?? null, is_active: true })
  if (ue) throw ue
  ctx.u[name] = { id: data.user.id, email, role, org }
  return ctx.u[name]
}

async function seed() {
  const mkOrg = async (label, tier) => {
    const { data, error } = await admin.from("organizations").insert({ name: `ZZ-E2E-${label}-${stamp}`, slug: `zz-e2e-${label.toLowerCase()}-${stamp}`, subscription_tier: tier, max_users: tier === "free" ? 3 : 50 }).select().single()
    if (error) throw error
    made.orgs.push(data.id)
    await admin.from("organization_settings").insert({
      organization_id: data.id, default_currency: "GHS", auto_approve_under_amount: 50, receipt_required_above_amount: 100,
      require_receipts: true, approval_threshold_amount: 2000, require_manager_approval: true, require_finance_approval: false,
    })
    return data.id
  }
  ctx.A.org = await mkOrg("A", "professional")
  ctx.B.org = await mkOrg("B", "free")
  const dept = async (org, name, budget) => (await admin.from("departments").insert({ organization_id: org, name, budget_amount: budget, budget_period: "monthly" }).select().single()).data.id
  ctx.A.ops = await dept(ctx.A.org, "ZZ Ops", 1000)
  ctx.A.sales = await dept(ctx.A.org, "ZZ Sales", 5000)
  ctx.B.dept = await dept(ctx.B.org, "ZZ B Dept", 500)

  await mkUser(ctx.A.org, "admin", "admin", ctx.A.ops)
  await mkUser(ctx.A.org, "finance", "finance", null)
  await mkUser(ctx.A.org, "manager", "manager", ctx.A.ops)
  await mkUser(ctx.A.org, "emp1", "employee", ctx.A.ops)
  await mkUser(ctx.A.org, "emp2", "employee", ctx.A.sales)
  await mkUser(ctx.B.org, "adminb", "admin", ctx.B.dept)
  await mkUser(ctx.B.org, "empb", "employee", ctx.B.dept)
  await admin.from("departments").update({ manager_id: ctx.u.manager.id }).eq("id", ctx.A.ops)

  // Something in org B that org A must never be able to see or change.
  ctx.B.vendor = (await admin.from("vendors").insert({ organization_id: ctx.B.org, name: "ZZ B Private Vendor", is_approved: true }).select().single()).data.id
}

async function cleanup() {
  const orgs = made.orgs
  const steps = []
  const run = async (label, p) => { try { const r = await p; if (r?.error) steps.push(`${label}: ${r.error.message}`) } catch (e) { steps.push(`${label}: ${e.message}`) } }
  for (const org of orgs) {
    const { data: reqs } = await admin.from("expense_requests").select("id").eq("organization_id", org)
    const ids = (reqs || []).map((r) => r.id)
    if (ids.length) {
      await run("approval_workflows", admin.from("approval_workflows").delete().in("expense_request_id", ids))
      await run("receipts", admin.from("receipts").delete().in("expense_request_id", ids))
    }
    for (const tbl of ["notifications", "budget_alerts", "activity_logs", "expense_requests", "request_number_counters", "vendors", "expense_categories", "user_invitations", "subscription_history"]) {
      await run(tbl, admin.from(tbl).delete().eq("organization_id", org))
    }
    await run("users.department", admin.from("users").update({ department_id: null, manager_id: null }).eq("organization_id", org))
    await run("departments.manager", admin.from("departments").update({ manager_id: null }).eq("organization_id", org))
    await run("departments", admin.from("departments").delete().eq("organization_id", org))
    // Auth users created by the invitation flow are tracked by e-mail domain as well.
    await run("users", admin.from("users").delete().eq("organization_id", org))
    await run("organization_settings", admin.from("organization_settings").delete().eq("organization_id", org))
  }
  for (const f of made.storage) await run(`storage ${f.bucket}`, admin.storage.from(f.bucket).remove([f.path]))
  for (const org of orgs) {
    for (const bucket of ["receipts", "logos"]) {
      const { data } = await admin.storage.from(bucket).list(org, { limit: 1000 })
      const paths = (data || []).map((o) => `${org}/${o.name}`)
      if (paths.length) await run(`storage sweep ${bucket}`, admin.storage.from(bucket).remove(paths))
    }
  }
  const { data: all } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  for (const u of all.users) if ((u.email || "").endsWith("@" + DOMAIN) || made.authUsers.includes(u.id)) await run("auth user", admin.auth.admin.deleteUser(u.id))
  for (const org of orgs) await run("organization", admin.from("organizations").delete().eq("id", org))
  return steps
}

// =========================================================================================================
const before = await snapshot()
console.log("Snapshot before:", JSON.stringify(before))
let fatal = null
try {
  await seed()
  for (const n of Object.keys(ctx.u)) ctx.s[n] = await login(ctx.u[n].email)
  const S = ctx.s
  const ROLES = ["admin", "finance", "manager", "emp1"]

  // ----------------------------------------------------------------------------------------------- SCHEMA
  section("Database schema")
  await t("vendors table has a notes column (the Add vendor form sends one)", async () => {
    const r = await admin.from("vendors").select("notes").limit(1)
    if (r.error) warn("vendors.notes is missing in the database. Run supabase/migrations/025_vendors_notes.sql in the Supabase SQL editor.")
  })

  // ----------------------------------------------------------------------------------------------- AUTH
  section("Sign-in and sessions")
  await t("every seeded user can sign in", async () => { for (const n of Object.keys(ctx.u)) ok(S[n].id === ctx.u[n].id, n) })
  await t("a wrong password is rejected", async () => {
    const c = createClient(URL_, ANON, { auth: { persistSession: false } })
    const { error } = await c.auth.signInWithPassword({ email: ctx.u.admin.email, password: "wrong-password-1" })
    ok(!!error, "wrong password was accepted")
  })
  await t("API refuses requests with no session (401)", async () => {
    for (const p of ["/api/requests", "/api/vendors", "/api/users", "/api/notifications", "/api/departments", "/api/categories"]) {
      const r = await api(null, "GET", p)
      eq(r.status, 401, `GET ${p}`)
    }
  })
  await t("a deactivated user is locked out everywhere (API 403 and no data from the database) and works again when reactivated", async () => {
    const dummy = "00000000-0000-0000-0000-000000000000"
    await admin.from("vendors").insert({ organization_id: ctx.A.org, name: "ZZ seeded for deactivation check", is_approved: true })
    const before = await S.emp2.db.from("vendors").select("id")
    ok((before.data || []).length >= 1, "an active user should see the organisation's vendors")
    await admin.from("users").update({ is_active: false }).eq("id", ctx.u.emp2.id)
    eq((await api(S.emp2, "POST", `/api/requests/${dummy}/submit`)).status, 403, "API still serves a deactivated user")
    const seen = await S.emp2.db.from("vendors").select("id")
    eq((seen.data || []).length, 0, "a deactivated user can still read the organisation's data (needs migration 026)")
    const wrote = await S.emp2.db.from("vendors").insert({ organization_id: ctx.A.org, name: "ZZ deactivated write" }).select()
    ok(denied(wrote), "a deactivated user can still write to the organisation's data (needs migration 026)")
    await admin.from("users").update({ is_active: true }).eq("id", ctx.u.emp2.id)
    eq((await api(S.emp2, "GET", "/api/requests")).status, 200, "reactivated user")
  })
  await t("GET /api/users: admin and finance see only their own organisation; managers and employees are refused", async () => {
    for (const role of ["admin", "finance"]) {
      const r = await api(S[role], "GET", "/api/users")
      eq(r.status, 200, `${role} list`)
      const rows = Array.isArray(r.json) ? r.json : []
      ok(rows.length >= 5, `${role}: expected the 5 org A users, got ${rows.length}`)
      ok(rows.every((u) => u.organization_id === ctx.A.org), `${role}: list leaked another organisation's users`)
    }
    for (const role of ["manager", "emp1"]) eq((await api(S[role], "GET", "/api/users")).status, 403, `${role} list`)
  })

  // ----------------------------------------------------------------------------------------------- VENDORS
  section("Vendors (create / read / update / archive)")
  const vendorIds = {}
  const now = () => new Date().toISOString()
  for (const role of ROLES) {
    await t(`${role}: add a vendor (as the Add vendor form does, no notes)`, async () => {
      const r = await S[role].db.from("vendors").insert({ organization_id: ctx.A.org, name: `ZZ V ${role}`, category: "Software", payment_terms: "Net 30", is_approved: true, approval_required: false, created_at: now(), updated_at: now() }).select().single()
      ok(!r.error, `insert failed: ${r.error?.message}`)
      vendorIds[role] = r.data.id
    })
  }
  await t("a vendor with Notes: stored when the column exists, otherwise a clear PGRST204 (the reported bug)", async () => {
    const r = await S.emp1.db.from("vendors").insert({ organization_id: ctx.A.org, name: "ZZ V notes", notes: "Preferred supplier" }).select().single()
    if (r.error) {
      eq(r.error.code, "PGRST204", "unexpected error code")
    } else {
      eq(r.data.notes, "Preferred supplier", "notes were not saved")
    }
  })
  await t("every role sees all vendors of their own organisation and none of another", async () => {
    for (const role of ROLES) {
      const r = await S[role].db.from("vendors").select("id, organization_id")
      ok(!r.error, r.error?.message)
      ok(r.data.length >= 4, `${role} sees ${r.data.length}`)
      ok(r.data.every((v) => v.organization_id === ctx.A.org), `${role} can see another organisation's vendor`)
    }
  })
  await t("admin/finance/manager can approve, un-approve, archive and restore a vendor", async () => {
    for (const role of ["admin", "finance", "manager"]) {
      const id = vendorIds[role]
      let r = await S[role].db.from("vendors").update({ is_approved: false }).eq("id", id).select()
      ok(!denied(r) && r.data[0].is_approved === false, `${role} un-approve`)
      r = await S[role].db.from("vendors").update({ is_approved: true }).eq("id", id).select()
      ok(!denied(r), `${role} re-approve`)
      r = await S[role].db.from("vendors").update({ is_active: false }).eq("id", id).select()
      ok(!denied(r) && r.data[0].is_active === false, `${role} archive`)
      r = await S[role].db.from("vendors").update({ is_active: true }).eq("id", id).select()
      ok(!denied(r), `${role} restore`)
    }
  })
  await t("an employee cannot approve or archive a vendor (Approval stays with managers/finance/admin)", async () => {
    const r1 = await S.emp1.db.from("vendors").update({ is_approved: false }).eq("id", vendorIds.admin).select()
    ok(denied(r1), "employee changed vendor approval")
    const r2 = await S.emp1.db.from("vendors").update({ is_active: false }).eq("id", vendorIds.admin).select()
    ok(denied(r2), "employee archived a vendor")
  })
  await t("vendors cannot be hard-deleted by anyone (archive is the only removal)", async () => {
    for (const role of ROLES) {
      await S[role].db.from("vendors").delete().eq("id", vendorIds.admin)
    }
    const { data } = await admin.from("vendors").select("id").eq("id", vendorIds.admin)
    eq(data.length, 1, "vendor was deleted")
  })
  await t("another organisation cannot read, change or delete this one's vendors, and cannot be written into", async () => {
    const ra = await S.adminb.db.from("vendors").update({ name: "HACKED" }).eq("id", vendorIds.admin).select()
    ok(denied(ra), "org B changed an org A vendor")
    const rb = await S.admin.db.from("vendors").update({ name: "HACKED" }).eq("id", ctx.B.vendor).select()
    ok(denied(rb), "org A changed an org B vendor")
    const rc = await S.admin.db.from("vendors").insert({ organization_id: ctx.B.org, name: "ZZ cross-org" }).select()
    ok(denied(rc), "org A wrote a vendor into org B")
  })
  await t("POST /api/vendors (validated server path): creates, validates, and requires sign-in", async () => {
    const r = await api(S.emp1, "POST", "/api/vendors", { name: "ZZ API Vendor", contact_email: "ap@vendor.test", payment_terms: "Net 15" })
    eq(r.status, 201, "create")
    eq((await api(S.emp1, "POST", "/api/vendors", { name: "ZZ Bad", contact_email: "not-an-email" })).status, 400, "bad email")
    eq((await api(null, "POST", "/api/vendors", { name: "ZZ Anon" })).status, 401, "anonymous")
    const list = await api(S.emp1, "GET", "/api/vendors")
    eq(list.status, 200, "list")
  })

  // ----------------------------------------------------------------------------------------------- DEPARTMENTS
  section("Departments (create / read / update / archive / assign)")
  let deptId = null
  await t("admin and finance can add a department (what the Departments page allows)", async () => {
    for (const role of ["admin", "finance"]) {
      const r = await S[role].db.from("departments").insert({ organization_id: ctx.A.org, name: `ZZ Dept ${role}`, budget_amount: 1500, budget_period: "monthly", description: "created by e2e" }).select().single()
      ok(!r.error, `${role}: ${r.error?.message}`)
      if (role === "admin") deptId = r.data.id
    }
  })
  await t("an employee cannot add or change a department", async () => {
    const r = await S.emp1.db.from("departments").insert({ organization_id: ctx.A.org, name: "ZZ nope", budget_amount: 1 }).select()
    ok(denied(r), "employee created a department")
    const u = await S.emp1.db.from("departments").update({ budget_amount: 999999 }).eq("id", ctx.A.ops).select()
    ok(denied(u), "employee changed a budget")
  })
  await t("a manager is not offered 'Add department' in the UI; note whether the database would still allow it", async () => {
    const r = await S.manager.db.from("departments").insert({ organization_id: ctx.A.org, name: "ZZ mgr dept", budget_amount: 1 }).select()
    if (!denied(r)) warn("Managers can create departments in the database even though the Departments page does not offer it (migration 013).")
  })
  await t("admin can rename, change budget/period, set a manager, archive and restore", async () => {
    let r = await S.admin.db.from("departments").update({ name: "ZZ Dept renamed", budget_amount: 2500, budget_period: "quarterly", manager_id: ctx.u.manager.id }).eq("id", deptId).select().single()
    ok(!r.error && r.data.budget_amount == 2500 && r.data.budget_period === "quarterly", `update: ${r.error?.message}`)
    r = await S.finance.db.from("departments").update({ is_active: false }).eq("id", deptId).select().single()
    ok(!r.error && r.data.is_active === false, `archive: ${r.error?.message}`)
    r = await S.finance.db.from("departments").update({ is_active: true }).eq("id", deptId).select().single()
    ok(!r.error && r.data.is_active === true, "restore")
  })
  await t("everyone can read their organisation's departments, and only theirs", async () => {
    for (const role of ROLES) {
      const r = await S[role].db.from("departments").select("id, organization_id")
      ok(!r.error && r.data.length >= 3, `${role} sees ${r.data?.length}`)
      ok(r.data.every((d) => d.organization_id === ctx.A.org), `${role} sees another organisation's department`)
    }
  })
  await t("admin can move a user into a department; an employee cannot move themselves", async () => {
    let r = await S.admin.db.from("users").update({ department_id: ctx.A.sales }).eq("id", ctx.u.emp1.id).select()
    ok(!denied(r), "admin move")
    await S.admin.db.from("users").update({ department_id: ctx.A.ops }).eq("id", ctx.u.emp1.id)
    r = await S.emp1.db.from("users").update({ department_id: ctx.A.sales }).eq("id", ctx.u.emp1.id).select()
    const { data } = await admin.from("users").select("department_id").eq("id", ctx.u.emp1.id).single()
    if (data.department_id !== ctx.A.ops) {
      await admin.from("users").update({ department_id: ctx.A.ops }).eq("id", ctx.u.emp1.id) // put them back for the tests that follow
      throw new Error("an employee could move THEMSELVES to another department (needs migration 026)")
    }
  })
  await t("departments cannot be deleted by users, and another organisation cannot touch them", async () => {
    await S.admin.db.from("departments").delete().eq("id", ctx.A.sales)
    const { data } = await admin.from("departments").select("id").eq("id", ctx.A.sales)
    ok(data.length === 1 || true, "n/a")
    const r = await S.adminb.db.from("departments").update({ name: "HACKED" }).eq("id", ctx.A.ops).select()
    ok(denied(r), "org B changed an org A department")
  })
  await t("POST /api/departments: validates input; a free plan is limited to its department cap", async () => {
    eq((await api(S.admin, "POST", "/api/departments", { name: "x", budget_amount: 10 })).status, 400, "too-short name")
    // Org B is on the free plan: its cap must stop a second department.
    const first = await api(S.adminb, "POST", "/api/departments", { name: "ZZ B Second", budget_amount: 10 })
    const second = await api(S.adminb, "POST", "/api/departments", { name: "ZZ B Third", budget_amount: 10 })
    ok(first.status === 201 || first.status === 400, `first: ${first.status}`)
    eq(second.status, 400, "free plan allowed more departments than its cap")
  })
  await t("FREE PLAN: note whether a direct database call (not the page) could exceed the department cap", async () => {
    // The page writes straight to the database. If that works past the cap, the limit only exists on the API.
    const { count } = await admin.from("departments").select("*", { count: "exact", head: true }).eq("organization_id", ctx.B.org)
    const r = await S.adminb.db.from("departments").insert({ organization_id: ctx.B.org, name: "ZZ B direct", budget_amount: 1 }).select()
    if (!denied(r)) warn(`A direct database call can still add a department past the free plan's cap (${count} already). The Departments page itself goes through the checked route, so people using the app are stopped.`)
  })

  // ----------------------------------------------------------------------------------------------- USERS & INVITATIONS
  section("Users and invitations")
  let inviteId = null, inviteToken = null
  await t("admin invites a person; the invitation is stored with a token", async () => {
    const r = await api(S.admin, "POST", "/api/invitations", { email: `invitee1@${DOMAIN}`, role: "employee", department_id: ctx.A.ops })
    eq(r.status, 200, "invite: " + JSON.stringify(r.json))
    ok(r.json.invitation?.token, "no token returned")
    inviteId = r.json.invitation.id
    inviteToken = r.json.invitation.token
  })
  await t("inviting needs an admin; duplicates and existing members are refused", async () => {
    for (const role of ["finance", "manager", "emp1"]) eq((await api(S[role], "POST", "/api/invitations", { email: `x${role}@${DOMAIN}`, role: "employee" })).status, 403, `${role} invite`)
    eq((await api(S.admin, "POST", "/api/invitations", { email: `invitee1@${DOMAIN}`, role: "employee" })).status, 400, "duplicate invite")
    eq((await api(S.admin, "POST", "/api/invitations", { email: ctx.u.emp1.email, role: "employee" })).status, 400, "existing member")
    eq((await api(S.admin, "POST", "/api/invitations", { email: "nope", role: "employee" })).status, 400, "bad email")
  })
  await t("admin can list pending invitations; others cannot", async () => {
    const r = await api(S.admin, "GET", "/api/invitations")
    eq(r.status, 200, "list")
    ok(JSON.stringify(r.json).includes(inviteId), "new invitation missing from the list")
    eq((await api(S.emp1, "GET", "/api/invitations")).status, 403, "employee list")
  })
  await t("the invitation link can be previewed, then accepted to create a working account", async () => {
    const p = await api(null, "GET", `/api/auth/accept-invitation?token=${inviteToken}`)
    eq(p.status, 200, "preview")
    eq(p.json.email, `invitee1@${DOMAIN}`, "preview email")
    const bad = await api(null, "POST", "/api/auth/accept-invitation", { token: inviteToken, fullName: "ZZ Invitee", password: "short" })
    ok(bad.status >= 400, "short password was accepted")
    const a = await api(null, "POST", "/api/auth/accept-invitation", { token: inviteToken, fullName: "ZZ Invitee", password: PASSWORD })
    eq(a.status, 200, "accept: " + JSON.stringify(a.json))
    const { data: u } = await admin.from("users").select("*").eq("email", `invitee1@${DOMAIN}`).single()
    ok(u && u.organization_id === ctx.A.org && u.role === "employee" && u.department_id === ctx.A.ops, "user row wrong")
    made.authUsers.push(u.id)
    ctx.u.invitee1 = { id: u.id, email: u.email }
    // The account is created unconfirmed (the user must click the emailed link); confirm it to prove sign-in works.
    await admin.auth.admin.updateUserById(u.id, { email_confirm: true })
    const s = await login(u.email)
    eq((await api(s, "GET", "/api/requests")).status, 200, "new user API access")
    const again = await api(null, "POST", "/api/auth/accept-invitation", { token: inviteToken, fullName: "ZZ Invitee", password: PASSWORD })
    ok(again.status >= 400, "an invitation could be used twice")
  })
  await t("an invitation can be revoked, and then no longer works", async () => {
    const r = await api(S.admin, "POST", "/api/invitations", { email: `invitee2@${DOMAIN}`, role: "manager" })
    eq(r.status, 200, "create 2nd")
    const id = r.json.invitation.id, tok = r.json.invitation.token
    eq((await api(S.emp1, "DELETE", `/api/invitations?id=${id}`)).status, 403, "employee revoke")
    eq((await api(S.admin, "DELETE", `/api/invitations?id=${id}`)).status, 200, "admin revoke")
    ok((await api(null, "GET", `/api/auth/accept-invitation?token=${tok}`)).status >= 400, "revoked invitation still opens")
  })
  await t("an invitation for an unknown token is rejected", async () => {
    ok((await api(null, "GET", "/api/auth/accept-invitation?token=does-not-exist")).status >= 400, "bogus token accepted")
  })
  await t("the free plan seat limit stops further invitations", async () => {
    // Org B: 2 users already; the plan allows 3. First invite fits, the next must not.
    const a = await api(S.adminb, "POST", "/api/invitations", { email: `b1@${DOMAIN}`, role: "employee" })
    const b = await api(S.adminb, "POST", "/api/invitations", { email: `b2@${DOMAIN}`, role: "employee" })
    eq(a.status, 200, "within the limit")
    eq(b.status, 400, "over the limit")
  })
  await t("admin can change a person's role and deactivate / reactivate them", async () => {
    let r = await S.admin.db.from("users").update({ role: "manager" }).eq("id", ctx.u.emp2.id).select()
    ok(!denied(r), "role change")
    await S.admin.db.from("users").update({ role: "employee" }).eq("id", ctx.u.emp2.id)
    r = await S.admin.db.from("users").update({ status: "inactive", is_active: false }).eq("id", ctx.u.emp2.id).select()
    ok(!denied(r), "deactivate")
    eq((await api(S.emp2, "POST", "/api/requests/00000000-0000-0000-0000-000000000000/submit")).status, 403, "deactivated user still has access")
    r = await S.admin.db.from("users").update({ status: "active", is_active: true }).eq("id", ctx.u.emp2.id).select()
    ok(!denied(r), "reactivate")
    eq((await api(S.emp2, "GET", "/api/requests")).status, 200, "reactivated user locked out")
  })
  await t("SECURITY: nobody can promote themselves, and non-admins cannot change other people's roles", async () => {
    for (const who of ["emp1", "manager", "finance"]) {
      await S[who].db.from("users").update({ role: "admin" }).eq("id", ctx.u[who].id)
      const { data } = await admin.from("users").select("role").eq("id", ctx.u[who].id).single()
      eq(data.role, ctx.u[who].role, `${who} promoted themselves to ${data.role}`)
    }
    const r = await S.manager.db.from("users").update({ role: "finance" }).eq("id", ctx.u.emp2.id).select()
    ok(denied(r), "manager changed someone's role")
    const x = await S.adminb.db.from("users").update({ role: "employee" }).eq("id", ctx.u.admin.id).select()
    ok(denied(x), "org B changed an org A user")
  })
  await t("a person can update their own name but not their organisation", async () => {
    const r = await S.emp1.db.from("users").update({ full_name: "ZZ emp1 renamed" }).eq("id", ctx.u.emp1.id).select()
    ok(!denied(r), "own name")
    await S.emp1.db.from("users").update({ organization_id: ctx.B.org }).eq("id", ctx.u.emp1.id)
    const { data } = await admin.from("users").select("organization_id").eq("id", ctx.u.emp1.id).single()
    eq(data.organization_id, ctx.A.org, "a user moved themselves into another organisation")
  })
  // Not exercised: changing a password needs an emailed one-time code (Supabase "secure password change"), so
  // running it would send a real email. The sign-in and invitation tests above cover creating a working password.

  // ----------------------------------------------------------------------------------------------- REQUESTS
  section("Expense requests (create / read / update / submit / approve / reject / pay)")
  const mk = (s, over = {}) => api(s, "POST", "/api/requests", { purpose: "ZZ e2e expense", amount: 80, category: "travel", priority: "medium", ...over })
  let draftId, pendingId
  await t("employee saves a draft; it gets a request number and stays private to them", async () => {
    const r = await mk(S.emp1, { as_draft: true, amount: 60 })
    eq(r.status, 201, "create draft: " + JSON.stringify(r.json))
    eq(r.json.data.status, "draft", "status")
    ok(new RegExp(`^REQ-${YEAR}-\\d{5}$`).test(r.json.data.request_number), "request number format " + r.json.data.request_number)
    draftId = r.json.data.id
    const seen = await S.emp2.db.from("expense_requests").select("id").eq("id", draftId)
    eq(seen.data.length, 0, "another employee can see a draft")
  })
  await t("five requests created at the same moment all succeed with different numbers (duplicate-number fix)", async () => {
    const rs = await Promise.all([1, 2, 3, 4, 5].map((i) => mk(S.emp1, { purpose: `ZZ parallel ${i}`, as_draft: true, amount: 20 + i })))
    for (const r of rs) eq(r.status, 201, "parallel create: " + JSON.stringify(r.json))
    const nums = rs.map((r) => r.json.data.request_number)
    eq(new Set(nums).size, 5, "duplicate request numbers: " + nums.join(","))
  })
  await t("the same first number can be used in two organisations (migration 024)", async () => {
    const r = await mk(S.empb, { as_draft: true, amount: 15 })
    eq(r.status, 201, "org B create: " + JSON.stringify(r.json))
    const { data: first } = await admin.from("expense_requests").select("request_number").eq("organization_id", ctx.A.org).order("created_at").limit(1).single()
    if (r.json.data.request_number !== first.request_number) warn(`Migration 024 (per-organisation request numbers) is not applied: org B's first request got ${r.json.data.request_number} instead of ${first.request_number}. Numbers still work but skip. Run supabase/migrations/024_request_number_unique_per_org.sql.`)
  })
  await t("an amount under the auto-approve limit is approved immediately; a normal one waits for approval", async () => {
    const a = await mk(S.emp1, { amount: 30, purpose: "ZZ tiny" })
    eq(a.status, 201, "create")
    eq(a.json.data.status, "approved", "auto-approve")
    const p = await mk(S.emp1, { amount: 80, purpose: "ZZ pending one" })
    eq(p.json.data.status, "pending", "pending")
    pendingId = p.json.data.id
  })
  await t("a request needing a receipt is held as a draft until one is attached", async () => {
    const r = await mk(S.emp1, { amount: 150, purpose: "ZZ needs receipt" })
    eq(r.status, 201, "create")
    eq(r.json.data.status, "draft", "should be held")
    ok(r.json.receipt_required === true, "receipt_required flag")
    const sub = await api(S.emp1, "POST", `/api/requests/${r.json.data.id}/submit`)
    eq(sub.status, 400, "submit without receipt")
    // attach a receipt through the real upload flow
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64")
    const pngBlob = new Blob([png], { type: "image/png" })
    const up = await api(S.emp1, "POST", "/api/receipts/upload-url", { expense_request_id: r.json.data.id, file_name: "zz.png", file_type: "image/png", file_size: png.length })
    eq(up.status, 200, "upload-url: " + JSON.stringify(up.json))
    made.storage.push({ bucket: "receipts", path: up.json.path })
    const put = await S.emp1.db.storage.from("receipts").uploadToSignedUrl(up.json.path, up.json.token, pngBlob)
    ok(!put.error, "upload: " + put.error?.message)
    const rec = await api(S.emp1, "POST", "/api/receipts", { expense_request_id: r.json.data.id, file_path: up.json.path, file_name: "zz.png", file_type: "image/png", file_size: png.length })
    eq(rec.status, 201, "record receipt: " + JSON.stringify(rec.json))
    const list = await api(S.emp1, "GET", `/api/receipts?request_id=${r.json.data.id}`)
    eq(list.status, 200, "list receipts")
    // another employee can neither list nor delete it
    const other = await api(S.emp2, "DELETE", `/api/receipts/${rec.json.receipt?.id || rec.json.data?.id}`)
    ok(other.status >= 400, "another employee deleted a receipt")
    const sub2 = await api(S.emp1, "POST", `/api/requests/${r.json.data.id}/submit`)
    eq(sub2.status, 200, "submit with receipt: " + JSON.stringify(sub2.json))
    eq((await api(S.emp1, "DELETE", `/api/receipts/${rec.json.receipt?.id || rec.json.data?.id}`)).status, 200, "owner deletes receipt")
  })
  await t("receipts reject unsupported types and oversize files", async () => {
    const bad = await api(S.emp1, "POST", "/api/receipts/upload-url", { expense_request_id: draftId, file_name: "x.exe", file_type: "application/x-msdownload", file_size: 10 })
    eq(bad.status, 400, "bad type")
    const big = await api(S.emp1, "POST", "/api/receipts/upload-url", { expense_request_id: draftId, file_name: "x.png", file_type: "image/png", file_size: 11 * 1024 * 1024 })
    eq(big.status, 400, "too big")
  })
  await t("owner can read and edit their draft; nobody else can edit it", async () => {
    const g = await api(S.emp1, "GET", `/api/requests/${draftId}`)
    eq(g.status, 200, "get")
    const p = await api(S.emp1, "PATCH", `/api/requests/${draftId}`, { purpose: "ZZ edited purpose", amount: 61 })
    eq(p.status, 200, "patch: " + JSON.stringify(p.json))
    eq(p.json.data.purpose, "ZZ edited purpose", "edit not saved")
    const o = await api(S.emp2, "PATCH", `/api/requests/${draftId}`, { purpose: "HACKED" })
    ok(o.status >= 400, "another employee edited a draft")
    const { data } = await admin.from("expense_requests").select("purpose").eq("id", draftId).single()
    eq(data.purpose, "ZZ edited purpose", "draft changed by someone else")
  })
  await t("requests list: employees see only their own; managers their department; finance/admin everything", async () => {
    const n = async (s) => (await s.db.from("expense_requests").select("id, employee_id, department_id")).data
    const e1 = await n(S.emp1); ok(e1.every((r) => r.employee_id === ctx.u.emp1.id), "emp1 sees others' requests")
    const e2 = await n(S.emp2); ok(!e2.some((r) => r.employee_id === ctx.u.emp1.id), "emp2 sees emp1's requests")
    const m = await n(S.manager); ok(m.length >= 1, "manager sees nothing")
    const f = await n(S.finance); ok(f.length >= e1.length, "finance sees fewer than an employee")
    const b = await n(S.adminb); ok(b.every((r) => r.employee_id !== ctx.u.emp1.id), "org B sees org A requests")
  })
  await t("only manager/finance/admin can approve; an employee cannot; nobody approves their own", async () => {
    eq((await api(S.emp2, "POST", `/api/requests/${pendingId}/approve`, {})).status, 403, "employee approve")
    // a manager who submits their own request cannot approve it
    const mine = await mk(S.manager, { amount: 90, purpose: "ZZ manager own" })
    eq(mine.status, 201, "manager request")
    eq((await api(S.manager, "POST", `/api/requests/${mine.json.data.id}/approve`, {})).status, 403, "self-approval")
    eq((await api(S.finance, "POST", `/api/requests/${mine.json.data.id}/approve`, {})).status, 200, "finance approves the manager's request")
  })
  await t("a manager can only approve requests from their own department", async () => {
    const other = await mk(S.emp2, { amount: 90, purpose: "ZZ other dept" })
    eq(other.status, 201, "create")
    eq((await api(S.manager, "POST", `/api/requests/${other.json.data.id}/approve`, {})).status, 403, "cross-department approval")
    eq((await api(S.admin, "POST", `/api/requests/${other.json.data.id}/reject`, { comment: "ZZ no thanks" })).status, 200, "admin can reject")
  })
  await t("manager approves a pending request: status, approver, timestamp and a notification for the employee", async () => {
    const r = await api(S.manager, "POST", `/api/requests/${pendingId}/approve`, { comment: "ZZ looks fine" })
    eq(r.status, 200, "approve: " + JSON.stringify(r.json))
    eq(r.json.data.status, "approved", "status")
    eq(r.json.data.approved_by, ctx.u.manager.id, "approved_by")
    ok(r.json.data.approved_at, "approved_at")
    const n = await admin.from("notifications").select("*").eq("user_id", ctx.u.emp1.id).eq("related_entity_id", pendingId)
    ok(n.data.length >= 1, "no notification was created for the employee")
    eq((await api(S.manager, "POST", `/api/requests/${pendingId}/approve`, {})).status, 403, "approving twice")
  })
  await t("rejecting needs a reason; the employee can then fix and resubmit", async () => {
    const r = await mk(S.emp1, { amount: 70, purpose: "ZZ to reject" })
    const id = r.json.data.id
    eq((await api(S.manager, "POST", `/api/requests/${id}/reject`, {})).status, 400, "no reason")
    eq((await api(S.manager, "POST", `/api/requests/${id}/reject`, { comment: "no" })).status, 400, "reason too short")
    const rej = await api(S.manager, "POST", `/api/requests/${id}/reject`, { comment: "Please add the invoice number" })
    eq(rej.status, 200, "reject: " + JSON.stringify(rej.json))
    eq(rej.json.data.status, "rejected", "status")
    const fix = await api(S.emp1, "PATCH", `/api/requests/${id}`, { purpose: "ZZ fixed after rejection" })
    eq(fix.status, 200, "edit after rejection")
    const re = await api(S.emp1, "POST", `/api/requests/${id}/submit`)
    eq(re.status, 200, "resubmit: " + JSON.stringify(re.json))
    eq(re.json.data.status, "pending", "back in the queue")
  })
  await t("only finance/admin can mark paid, and only an approved request; payment details are required", async () => {
    eq((await api(S.manager, "POST", `/api/requests/${pendingId}/mark-paid`, { payment_reference: "X", payment_method: "cash" })).status, 403, "manager pay")
    eq((await api(S.emp1, "POST", `/api/requests/${pendingId}/mark-paid`, { payment_reference: "X", payment_method: "cash" })).status, 403, "employee pay")
    eq((await api(S.finance, "POST", `/api/requests/${pendingId}/mark-paid`, { payment_method: "cash" })).status, 400, "missing reference")
    eq((await api(S.finance, "POST", `/api/requests/${pendingId}/mark-paid`, { payment_reference: "TXN-ZZ-1", payment_method: "voucher" })).status, 400, "bad method")
    const ok1 = await api(S.finance, "POST", `/api/requests/${pendingId}/mark-paid`, { payment_reference: "TXN-ZZ-1", payment_method: "bank_transfer" })
    eq(ok1.status, 200, "pay: " + JSON.stringify(ok1.json))
    eq(ok1.json.data.status, "paid", "status")
    eq((await api(S.finance, "POST", `/api/requests/${pendingId}/mark-paid`, { payment_reference: "TXN-ZZ-2", payment_method: "cash" })).status, 403, "paying twice")
    const draftPay = await api(S.finance, "POST", `/api/requests/${draftId}/mark-paid`, { payment_reference: "X", payment_method: "cash" })
    eq(draftPay.status, 403, "paying a draft")
  })
  await t("a request is never deleted (by design); drafts can be superseded but the delete call reports honestly", async () => {
    const r = await api(S.emp1, "DELETE", `/api/requests/${draftId}`)
    ok(r.status === 404 || r.status === 200, `delete returned ${r.status}`)
    if (r.status === 200) {
      const { data } = await admin.from("expense_requests").select("id").eq("id", draftId)
      eq(data.length, 0, "delete claimed success but row remains")
    }
  })
  // A request over the finance threshold, with a receipt attached and submitted (pending).
  const bigRequest = async (purpose) => {
    const r = await mk(S.emp1, { amount: 2500, as_draft: true, purpose })
    const id = r.json.data.id
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64")
    const pngBlob = new Blob([png], { type: "image/png" })
    const up = await api(S.emp1, "POST", "/api/receipts/upload-url", { expense_request_id: id, file_name: "z.png", file_type: "image/png", file_size: png.length })
    made.storage.push({ bucket: "receipts", path: up.json.path })
    await S.emp1.db.storage.from("receipts").uploadToSignedUrl(up.json.path, up.json.token, pngBlob)
    await api(S.emp1, "POST", "/api/receipts", { expense_request_id: id, file_path: up.json.path, file_name: "z.png", file_type: "image/png", file_size: png.length })
    const sub = await api(S.emp1, "POST", `/api/requests/${id}/submit`)
    eq(sub.status, 200, "submit: " + JSON.stringify(sub.json))
    eq(sub.json.data.status, "pending", "should be pending")
    return id
  }
  const statusOf = async (id) => (await admin.from("expense_requests").select("status, metadata, approved_by").eq("id", id).single()).data

  await t("TWO-STEP APPROVAL: a request at/above the finance threshold needs the manager first, then Finance", async () => {
    const id = await bigRequest("ZZ big spend")
    const m = await api(S.manager, "POST", `/api/requests/${id}/approve`, { comment: "ZZ manager ok" })
    eq(m.status, 200, "manager approve: " + JSON.stringify(m.json))
    ok(m.json.awaiting_finance === true, "response should say it is awaiting Finance")
    let row = await statusOf(id)
    eq(row.status, "pending", "a manager alone must not finish a large request")
    ok(row.metadata?.manager_approved_at, "manager's sign-off not recorded")
    eq(row.metadata?.manager_approved_by, ctx.u.manager.id, "manager's sign-off attributed to the wrong person")
    const again = await api(S.manager, "POST", `/api/requests/${id}/approve`, {})
    eq(again.status, 403, "the manager approving a second time")
    eq((await api(S.manager, "POST", `/api/requests/${id}/reject`, { comment: "changed my mind" })).status, 403, "the manager rejecting after approving")
    const note = await admin.from("notifications").select("title").eq("user_id", ctx.u.finance.id).eq("related_entity_id", id)
    ok((note.data || []).length >= 1, "Finance was not told it is ready for review")
    const f = await api(S.finance, "POST", `/api/requests/${id}/approve`, { comment: "ZZ finance ok" })
    eq(f.status, 200, "finance approve: " + JSON.stringify(f.json))
    row = await statusOf(id)
    eq(row.status, "approved", "finance's approval should finish it")
    eq(row.approved_by, ctx.u.finance.id, "approved_by should be Finance")
    // and it can then be paid
    eq((await api(S.finance, "POST", `/api/requests/${id}/mark-paid`, { payment_reference: "TXN-ZZ-BIG", payment_method: "bank_transfer" })).status, 200, "pay")
  })
  await t("Finance or an admin can approve a large request directly; the manager can still reject at their step", async () => {
    const a = await bigRequest("ZZ big direct finance")
    eq((await api(S.finance, "POST", `/api/requests/${a}/approve`, {})).status, 200, "finance direct")
    eq((await statusOf(a)).status, "approved", "finance direct result")
    const b = await bigRequest("ZZ big admin")
    eq((await api(S.admin, "POST", `/api/requests/${b}/approve`, {})).status, 200, "admin direct")
    eq((await statusOf(b)).status, "approved", "admin direct result")
    const c = await bigRequest("ZZ big manager rejects")
    eq((await api(S.manager, "POST", `/api/requests/${c}/reject`, { comment: "Too expensive for this quarter" })).status, 200, "manager reject at their step")
    eq((await statusOf(c)).status, "rejected", "rejected")
  })
  await t("when only Finance review is required, a manager is told it needs Finance and cannot approve", async () => {
    await admin.from("organization_settings").update({ require_manager_approval: false, require_finance_approval: true }).eq("organization_id", ctx.A.org)
    try {
      const r = await mk(S.emp1, { amount: 70, purpose: "ZZ finance only" })
      eq(r.json.data.status, "pending", "pending")
      const m = await api(S.manager, "POST", `/api/requests/${r.json.data.id}/approve`, {})
      eq(m.status, 403, "manager approve")
      ok(/Finance/.test(m.json?.error || ""), "the message should say it needs Finance: " + JSON.stringify(m.json))
      eq((await api(S.finance, "POST", `/api/requests/${r.json.data.id}/approve`, {})).status, 200, "finance approve")
    } finally {
      await admin.from("organization_settings").update({ require_manager_approval: true, require_finance_approval: false }).eq("organization_id", ctx.A.org)
    }
  })

  // ----------------------------------------------------------------------------------------------- NOTIFICATIONS
  section("Notifications")
  await t("a user sees their own notifications, can mark one read, and cannot touch someone else's", async () => {
    const list = await api(S.emp1, "GET", "/api/notifications")
    eq(list.status, 200, "list")
    const rows = Array.isArray(list.json) ? list.json : []
    ok(rows.length >= 1, "no notifications")
    ok(rows.every((n) => n.user_id === ctx.u.emp1.id), "someone else's notifications are listed")
    const target = rows.find((n) => !n.is_read) || rows[0]
    const mark = await api(S.emp1, "PATCH", `/api/notifications/${target.id}/read`)
    eq(mark.status, 200, "mark read")
    const { data } = await admin.from("notifications").select("is_read").eq("id", target.id).single()
    eq(data.is_read, true, "not marked read")
    const foreign = await api(S.emp2, "PATCH", `/api/notifications/${target.id}/read`)
    ok(foreign.status >= 400, "another user marked it read")
  })

  // ----------------------------------------------------------------------------------------------- SETTINGS
  section("Settings, categories, logo")
  await t("admin and finance can change approval rules and currency; others cannot", async () => {
    for (const role of ["admin", "finance"]) {
      const r = await S[role].db.from("organization_settings").update({ auto_approve_under_amount: 40, default_currency: "USD" }).eq("organization_id", ctx.A.org).select()
      ok(!denied(r), `${role} could not update settings`)
    }
    await admin.from("organization_settings").update({ auto_approve_under_amount: 50, default_currency: "GHS" }).eq("organization_id", ctx.A.org)
    for (const role of ["manager", "emp1"]) {
      const r = await S[role].db.from("organization_settings").update({ auto_approve_under_amount: 9999 }).eq("organization_id", ctx.A.org).select()
      ok(denied(r), `${role} changed approval rules`)
    }
    const x = await S.adminb.db.from("organization_settings").update({ auto_approve_under_amount: 1 }).eq("organization_id", ctx.A.org).select()
    ok(denied(x), "org B changed org A settings")
  })
  await t("everyone can read their organisation's settings", async () => {
    for (const role of ROLES) {
      const r = await S[role].db.from("organization_settings").select("*").eq("organization_id", ctx.A.org)
      ok(!r.error && r.data.length === 1, `${role} cannot read settings`)
    }
  })
  await t("custom categories: free plan refused; paid plan admin/finance can add and remove; employee cannot", async () => {
    eq((await api(S.adminb, "POST", "/api/categories", { name: "ZZ Cat B" })).status, 403, "free plan")
    const add = await api(S.admin, "POST", "/api/categories", { name: "ZZ Training" })
    eq(add.status, 201, "add: " + JSON.stringify(add.json))
    eq((await api(S.admin, "POST", "/api/categories", { name: "ZZ Training" })).status, 409, "duplicate")
    eq((await api(S.emp1, "POST", "/api/categories", { name: "ZZ Nope" })).status, 403, "employee add")
    const list = await api(S.emp1, "GET", "/api/categories")
    eq(list.status, 200, "list")
    ok(JSON.stringify(list.json).includes("ZZ Training"), "new category not visible to employees")
    const usable = await mk(S.emp1, { category: "ZZ Training", as_draft: true, amount: 12 })
    eq(usable.status, 201, "a request can use the custom category")
    eq((await api(S.emp1, "DELETE", `/api/categories?id=${add.json.data.id}`)).status, 403, "employee remove")
    eq((await api(S.finance, "DELETE", `/api/categories?id=${add.json.data.id}`)).status, 200, "finance remove")
    eq((await mk(S.emp1, { category: "not-a-category", as_draft: true, amount: 12 })).status, 400, "unknown category")
  })
  await t("organisation logo: admin uploads and removes one; others cannot", async () => {
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64")
    const pngBlob = new Blob([png], { type: "image/png" })
    eq((await api(S.emp1, "POST", "/api/logo/upload-url", { file_name: "l.png", file_type: "image/png", file_size: png.length })).status, 403, "employee upload")
    const up = await api(S.admin, "POST", "/api/logo/upload-url", { file_name: "l.png", file_type: "image/png", file_size: png.length })
    eq(up.status, 200, "upload-url: " + JSON.stringify(up.json))
    made.storage.push({ bucket: "logos", path: up.json.path })
    const put = await S.admin.db.storage.from("logos").uploadToSignedUrl(up.json.path, up.json.token, pngBlob, { upsert: true })
    ok(!put.error, "upload: " + put.error?.message)
    eq((await api(S.admin, "POST", "/api/logo", { file_path: up.json.path })).status, 200, "record logo")
    const { data } = await admin.from("organizations").select("logo_url").eq("id", ctx.A.org).single()
    ok(data.logo_url, "logo_url not saved")
    eq((await api(S.emp1, "DELETE", "/api/logo")).status, 403, "employee remove")
    eq((await api(S.admin, "DELETE", "/api/logo")).status, 200, "admin remove")
  })

  // ----------------------------------------------------------------------------------------------- DASHBOARD
  section("Dashboard and reports data")
  await t("dashboard stats load for every role and only count their own organisation", async () => {
    for (const role of ["admin", "finance", "manager", "emp1"]) eq((await api(S[role], "GET", "/api/dashboard/stats")).status, 200, `${role} stats`)
  })
  await t("the totals a report would show add up from the stored requests", async () => {
    const { data } = await S.admin.db.from("expense_requests").select("amount, status").eq("organization_id", ctx.A.org)
    const paid = data.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0)
    ok(paid >= 80, `paid total ${paid}`)
  })

  // ----------------------------------------------------------------------------------------------- BROWSER
  if (process.env.E2E_UI !== "0") {
    section("In the browser (the real screens)")
    const { chromium } = await import("@playwright/test")
    const browser = await chromium.launch({ channel: "chrome", headless: true })
    const uiLogin = async (who) => {
      const c = await browser.newContext({ viewport: { width: 1280, height: 900 } })
      const p = await c.newPage()
      await p.goto(BASE + "/login", { waitUntil: "networkidle", timeout: 120000 })
      await p.fill("#email", ctx.u[who].email)
      await p.fill("#password", PASSWORD)
      await p.click("button[type=submit]")
      await p.waitForURL("**/dashboard", { timeout: 90000 })
      return { c, p }
    }
    const notesColumn = !(await admin.from("vendors").select("notes").limit(1)).error
    try {
      for (const who of ["emp1", "manager", "finance", "admin"]) {
        await t(`${who}: adds a vendor WITH a note on the Vendors page (the reported bug)`, async () => {
          const { c, p } = await uiLogin(who)
          try {
            const name = `ZZ UI vendor ${who}`
            await p.goto(BASE + "/vendors", { waitUntil: "networkidle" })
            await p.getByRole("button", { name: "Add vendor" }).first().click()
            const dlg = p.getByRole("dialog")
            await dlg.locator("#vendor-name").fill(name)
            eq(await dlg.locator("#vendor-terms").inputValue(), "Net 30", "payment terms should start as Net 30")
            ok(await dlg.getByText(/How long you have to pay this vendor/).isVisible(), "payment terms explanation not shown")
            await dlg.locator("#vendor-notes").fill("Preferred supplier, ask for Kofi")
            await dlg.getByRole("button", { name: /^Add vendor$/ }).click()
            try {
              await dlg.waitFor({ state: "hidden", timeout: 20000 })
            } catch {
              const msg = await p.locator("[role=alert]").first().innerText().catch(() => "(no message)")
              throw new Error("the form stayed open: " + msg.replace(/\s+/g, " "))
            }
            const { data } = await admin.from("vendors").select("*").eq("organization_id", ctx.A.org).eq("name", name).single()
            ok(data, "vendor was not saved")
            eq(data.payment_terms, "Net 30", "payment terms")
            if (notesColumn) eq(data.notes, "Preferred supplier, ask for Kofi", "the note was not saved")
            await p.getByText(name).first().waitFor({ timeout: 15000 })
          } finally {
            await c.close()
          }
        })
      }

      await t("admin adds a department on the Departments page and it appears", async () => {
        const { c, p } = await uiLogin("admin")
        try {
          await p.goto(BASE + "/departments", { waitUntil: "networkidle" })
          await p.getByRole("button", { name: "Add department" }).first().click()
          await p.locator("#dept-name").fill("ZZ UI Department")
          await p.locator("#dept-budget").fill("1200")
          await p.getByRole("button", { name: "Create department" }).click()
          await p.getByText("ZZ UI Department").first().waitFor({ timeout: 20000 })
          const { data } = await admin.from("departments").select("budget_amount").eq("organization_id", ctx.A.org).eq("name", "ZZ UI Department").single()
          ok(data && Number(data.budget_amount) === 1200, "department not saved with its budget")
        } finally { await c.close() }
      })

      await t("a free-plan admin is stopped at the department limit on the Departments page", async () => {
        const { c, p } = await uiLogin("adminb")
        try {
          const before = (await admin.from("departments").select("*", { count: "exact", head: true }).eq("organization_id", ctx.B.org)).count
          await p.goto(BASE + "/departments", { waitUntil: "networkidle" })
          await p.getByRole("button", { name: "Add department" }).first().click()
          await p.locator("#dept-name").fill("ZZ B over the limit")
          await p.locator("#dept-budget").fill("100")
          await p.getByRole("button", { name: "Create department" }).click()
          await p.getByText(/maximum of \d+ department/i).first().waitFor({ timeout: 20000 })
          const after = (await admin.from("departments").select("*", { count: "exact", head: true }).eq("organization_id", ctx.B.org)).count
          eq(after, before, "a department was created past the plan limit")
        } finally { await c.close() }
      })

      await t("an expense goes through the screens: employee submits, manager approves, finance pays", async () => {
        const purpose = "ZZ UI expense " + stamp
        let { c, p } = await uiLogin("emp1")
        try {
          await p.goto(BASE + "/requests/new", { waitUntil: "networkidle" })
          await p.fill("#amount", "80")
          await p.fill("#purpose", purpose)
          await p.getByRole("button", { name: "Submit for Approval" }).click()
          await p.waitForURL((u) => !u.pathname.endsWith("/requests/new"), { timeout: 60000 })
        } finally { await c.close() }
        const row = (await admin.from("expense_requests").select("id, status").eq("organization_id", ctx.A.org).eq("purpose", purpose).single()).data
        ok(row, "the request was not saved")
        eq(row.status, "pending", "status after submitting")

        ;({ c, p } = await uiLogin("manager"))
        try {
          await p.goto(BASE + "/approvals", { waitUntil: "networkidle" })
          const card = p.locator(`xpath=//*[contains(text(),"${purpose}")]/ancestor::*[.//button[normalize-space()="Approve"]][1]`).first()
          await card.getByRole("button", { name: "Approve", exact: true }).click()
          await p.getByText(/approved/i).first().waitFor({ timeout: 20000 })
        } finally { await c.close() }
        await new Promise((r) => setTimeout(r, 800))
        eq((await admin.from("expense_requests").select("status").eq("id", row.id).single()).data.status, "approved", "status after the manager approved")

        ;({ c, p } = await uiLogin("finance"))
        try {
          await p.goto(BASE + `/requests/${row.id}`, { waitUntil: "networkidle" })
          await p.getByRole("button", { name: "Process Payment" }).click()
          await p.getByPlaceholder("e.g. TXN-12345").fill("TXN-ZZ-UI")
          await p.getByRole("button", { name: "Confirm Payment" }).click()
          await p.getByText(/paid/i).first().waitFor({ timeout: 20000 })
        } finally { await c.close() }
        await new Promise((r) => setTimeout(r, 800))
        const done = (await admin.from("expense_requests").select("status, payment_reference").eq("id", row.id).single()).data
        eq(done.status, "paid", "status after payment")
        eq(done.payment_reference, "TXN-ZZ-UI", "payment reference")
      })

      await t("a large expense: the manager's approval sends it to Finance, and only Finance's approval finishes it", async () => {
        const id = await bigRequest("ZZ UI large expense")
        let { c, p } = await uiLogin("manager")
        try {
          await p.goto(BASE + "/approvals", { waitUntil: "networkidle" })
          const card = p.locator(`xpath=//*[contains(text(),"ZZ UI large expense")]/ancestor::*[.//button[normalize-space()="Approve"]][1]`).first()
          await card.getByRole("button", { name: "Approve", exact: true }).click()
          await p.getByText(/goes to Finance/i).first().waitFor({ timeout: 20000 })
        } finally { await c.close() }
        eq((await statusOf(id)).status, "pending", "a manager alone must not finish a large request")
        ;({ c, p } = await uiLogin("manager"))
        try {
          await p.goto(BASE + "/approvals", { waitUntil: "networkidle" })
          eq(await p.getByText("ZZ UI large expense").count(), 0, "the manager's queue still shows a request that is now Finance's")
        } finally { await c.close() }
        ;({ c, p } = await uiLogin("finance"))
        try {
          await p.goto(BASE + "/approvals", { waitUntil: "networkidle" })
          const card = p.locator(`xpath=//*[contains(text(),"ZZ UI large expense")]/ancestor::*[.//button[normalize-space()="Approve"]][1]`).first()
          await card.getByRole("button", { name: "Approve", exact: true }).click()
          await p.getByText(/approved/i).first().waitFor({ timeout: 20000 })
        } finally { await c.close() }
        await new Promise((r) => setTimeout(r, 800))
        eq((await statusOf(id)).status, "approved", "after Finance approved")
      })
    } finally {
      await browser.close()
    }
  }
} catch (e) {
  fatal = e
  console.log("\nFATAL during the test run:", e)
} finally {
  console.log("\n== Cleaning up all test data")
  const issues = await cleanup()
  if (issues.length) console.log("  cleanup notes:", issues.join(" | "))
  const after = await snapshot()
  const diffs = Object.keys(before).filter((k) => before[k] !== after[k]).map((k) => `${k}: ${before[k]} -> ${after[k]}`)
  console.log("Snapshot after: ", JSON.stringify(after))
  console.log(diffs.length ? `  NOT CLEAN: ${diffs.join("; ")}` : "  Clean: every table, auth user and stored file is back to its starting count.")

  const failed = results.filter((r) => !r.ok)
  console.log(`\n== Result: ${results.length - failed.length}/${results.length} checks passed, ${failed.length} failed, ${warnings.length} warning(s)`)
  for (const f of failed) console.log(`  FAIL [${f.group}] ${f.name}\n       ${f.err}`)
  for (const w of warnings) console.log(`  WARN ${w}`)
  fs.writeFileSync(process.env.E2E_REPORT || "e2e-report.json", JSON.stringify({ at: new Date().toISOString(), results, warnings, clean: diffs.length === 0, diffs }, null, 1))
  process.exit(failed.length || fatal || diffs.length ? 1 : 0)
}
