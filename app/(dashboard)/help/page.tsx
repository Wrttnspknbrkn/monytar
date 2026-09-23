"use client"

import { useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  Rocket,
  FileText,
  CheckSquare,
  Store,
  Building2,
  BarChart3,
  Settings as SettingsIcon,
  Shield,
  LifeBuoy,
  Lightbulb,
  AlertTriangle,
  Info,
} from "lucide-react"
import { useAuth, useData } from "@/lib/providers"
import { getRoleLabel } from "@/lib/utils"
import { RequestStatusBadge } from "@/components/requests/request-status-badge"
import { roleBadgeColors } from "@/components/layout/account-info"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { UserRole } from "@/lib/types"

// ---------------------------------------------------------------------------
// Small presentational helpers, local to this page
// ---------------------------------------------------------------------------

/** Marks literal on-screen text — a button, tab, or field name — distinct from prose. */
function UI({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border/60 bg-secondary/60 px-1.5 py-0.5 font-mono text-[0.85em] font-medium text-foreground">
      {children}
    </span>
  )
}

function Callout({ tone = "tip", children }: { tone?: "tip" | "warn" | "info"; children: React.ReactNode }) {
  const Icon = tone === "warn" ? AlertTriangle : tone === "info" ? Info : Lightbulb
  const styles =
    tone === "warn"
      ? "bg-amber-50 border-amber-200/60 text-amber-900 dark:bg-amber-900/10 dark:border-amber-800/30 dark:text-amber-200"
      : tone === "info"
        ? "bg-secondary/50 border-border/60 text-foreground"
        : "bg-primary/5 border-primary/15 text-foreground"
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm leading-relaxed ${styles}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
      <div>{children}</div>
    </div>
  )
}

function Task({ title, when, children }: { title: string; when?: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base font-bold">{title}</CardTitle>
        {when && <CardDescription className="text-xs">{when}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm leading-relaxed [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-1.5 [&_p]:text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  )
}

function Field({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-1 mb-0.5">{children}</p>
}

const ROLES: UserRole[] = ["employee", "manager", "finance", "admin"]
const ROLE_TAGLINE: Record<UserRole, string> = {
  employee: "Submits their own expenses and tracks them.",
  manager: "Everything Employee can do, plus approves requests from their own department.",
  finance: "Everything Manager can do, plus approves any request, processes payments, and manages vendors, categories and Reports.",
  admin: "Full access — everything above, plus users, departments, organization settings and billing.",
}

export default function HelpPage() {
  const { dbUser } = useAuth()
  const { currentUser } = useData()
  const user = dbUser || currentUser
  const [tab, setTab] = useState("start")

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-primary/10 shrink-0">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Help &amp; Guide</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Everything you can do in Monytar, in plain language.
            {user && (
              <>
                {" "}
                You&apos;re signed in as{" "}
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider align-middle ${roleBadgeColors[user.role]}`}
                >
                  {getRoleLabel(user.role)}
                </span>
                , so this page highlights what&apos;s relevant to you.
              </>
            )}
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="h-9 gap-0.5 bg-secondary/60 p-0.5">
          <TabsTrigger value="start" className="text-xs font-semibold h-8 px-3"><Rocket className="w-3.5 h-3.5 mr-1.5" /> Getting Started</TabsTrigger>
          <TabsTrigger value="requests" className="text-xs font-semibold h-8 px-3"><FileText className="w-3.5 h-3.5 mr-1.5" /> Expenses</TabsTrigger>
          <TabsTrigger value="approvals" className="text-xs font-semibold h-8 px-3"><CheckSquare className="w-3.5 h-3.5 mr-1.5" /> Approvals &amp; Pay</TabsTrigger>
          <TabsTrigger value="resources" className="text-xs font-semibold h-8 px-3"><Store className="w-3.5 h-3.5 mr-1.5" /> Vendors &amp; Reports</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs font-semibold h-8 px-3"><SettingsIcon className="w-3.5 h-3.5 mr-1.5" /> Settings &amp; Admin</TabsTrigger>
          <TabsTrigger value="faq" className="text-xs font-semibold h-8 px-3"><LifeBuoy className="w-3.5 h-3.5 mr-1.5" /> FAQ &amp; Help</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------ */}
        {/* Getting Started                                              */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="start" className="mt-5 flex flex-col gap-5">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base font-bold">Quick start</CardTitle>
              <CardDescription className="text-xs">Five steps to understand the whole system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { n: "1", t: "Sign in", d: "Use the email and password your admin set up for you." },
                  { n: "2", t: "Check your identity", d: "The bottom of the left menu shows your name, role and department." },
                  { n: "3", t: "Find your way around", d: "The left menu lists every page your role can use." },
                  { n: "4", t: "Add an expense", d: <>Go to <UI>Requests</UI> → <UI>New request</UI>, fill it in, submit it.</> },
                  { n: "5", t: "Watch it move", d: "Its status changes as it's approved, rejected, or paid." },
                ].map((s) => (
                  <div key={s.n} className="flex flex-col gap-1.5 p-3 rounded-xl bg-secondary/40 border border-border/40">
                    <span className="font-heading font-extrabold text-primary text-xs">{s.n}</span>
                    <span className="text-sm font-semibold">{s.t}</span>
                    <span className="text-xs text-muted-foreground leading-relaxed">{s.d}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">That&apos;s the whole loop: submit → get approved → get paid. Everything else in Monytar supports that loop.</p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base font-bold">Roles in Monytar</CardTitle>
              <CardDescription className="text-xs">Your admin assigns your role — you can&apos;t change it yourself</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <div key={r} className="p-3.5 rounded-xl border border-border/60 flex flex-col gap-1.5">
                    <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider ${roleBadgeColors[r]}`}>
                      {getRoleLabel(r)}
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed">{ROLE_TAGLINE[r]}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Every role can submit their own expenses, view <UI>Requests</UI>, check <UI>Notifications</UI>, and use <UI>Settings</UI>. What differs is what else shows up in the left menu.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base font-bold">Signing in</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>Enter your <UI>Email</UI> and <UI>Password</UI>, then click <UI>Sign in</UI>.</p>
              <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li>Forgot your password? Click <UI>Forgot?</UI> next to the password field — you&apos;ll get a reset link by email.</li>
                <li>&quot;Incorrect email or password&quot; — double-check what you typed, or reset it.</li>
                <li>&quot;Your email address isn&apos;t verified yet&quot; — open the confirmation email and click the link, then come back and sign in.</li>
                <li>Sent back to login with a message like &quot;You&apos;ve been signed out&quot;? That&apos;s not an error you caused — just sign in again.</li>
                <li>&quot;This account has been deactivated&quot; — an admin turned off your access. Ask them to reactivate it.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base font-bold">Getting your account set up</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <div>
                <p className="font-semibold mb-1">You were invited by your company&apos;s admin</p>
                <p className="text-muted-foreground">
                  Click the link in your invitation email — it opens a <UI>Join [Your Company]</UI> page pre-filled with your email and role. Enter your <UI>Full name</UI> and a <UI>Password</UI> (8+ characters), then click <UI>Accept invitation</UI>.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">You&apos;re setting up a brand-new company account</p>
                <p className="text-muted-foreground">
                  Go to <UI>Sign up</UI> — a short wizard: Account Details, Organization, Choose Plan, Get Started. This makes you the first user of a new organization, so you become its Admin automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* Expenses / Requests                                          */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="requests" className="mt-5 flex flex-col gap-5">
          <Callout tone="info">
            Every expense you submit is called a <b>Request</b>. Click <UI>Requests</UI> in the left menu — Employees see <UI>My Requests</UI> (just their own); Managers, Finance and Admins see <UI>All Requests</UI> (everyone&apos;s, though you can still submit and track your own from there too).
          </Callout>

          <Task title="How to add an expense" when="When you've paid for something for work — or need pre-approval to spend — and need a record of it.">
            <ol>
              <li>Click <UI>Requests</UI> → <UI>New request</UI>.</li>
              <li>Under Amount &amp; Category, enter the <UI>Amount</UI> and pick a <UI>Category</UI>.</li>
              <li>Write your <UI>Business Justification</UI> — required.</li>
              <li>Optionally pick a <UI>Vendor</UI> (only approved, active vendors appear).</li>
              <li>Optionally set a <UI>Priority</UI> — shown to the reviewer as context.</li>
              <li>Check the <UI>Expense Date</UI> (defaults to today) and optional <UI>Due Date</UI>.</li>
              <li>Add <UI>Additional Notes</UI> if useful.</li>
              <li>Attach your receipt(s) — see below.</li>
              <li>Click <UI>Save as Draft</UI> to finish later, or <UI>Submit for Approval</UI> to send it now.</li>
            </ol>
            <Field>What happens next</Field>
            <p>Monytar checks the amount against your organization&apos;s rules. Small expenses may auto-approve instantly with no reviewer. Otherwise it enters the approval chain and you&apos;re notified once someone decides.</p>
            <Callout tone="tip">You don&apos;t need everything ready at once — <UI>Save as Draft</UI> keeps it private until you submit it.</Callout>
          </Task>

          <Task title="How to add a receipt" when="Any time you have a photo or PDF of your receipt, invoice, or proof of purchase.">
            <ol>
              <li>On the request form (or an existing request), find <UI>Receipts</UI>.</li>
              <li>Click <UI>Click to upload receipts</UI>.</li>
              <li>Choose one or more files — JPG, PNG, WEBP, HEIC or PDF, up to 10&nbsp;MB each.</li>
            </ol>
            <Field>What happens next</Field>
            <p>The file appears in a list with a small remove button before saving. Once saved, it stays attached permanently as your proof of purchase.</p>
            <Callout tone="warn">If your organization requires a receipt above a certain amount, Monytar shows a warning and blocks <UI>Submit for Approval</UI> until one is attached — or you can <UI>Save as Draft</UI> and add it later.</Callout>
          </Task>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-border/60">
              <CardHeader className="pb-2"><CardTitle className="font-heading text-sm font-bold">Editing an expense</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                You can only edit your own request, and only while it&apos;s <RequestStatusBadge status="draft" className="align-middle" /> or <RequestStatusBadge status="rejected" className="align-middle" />. Open it, make changes, and save or submit again. Once it&apos;s <RequestStatusBadge status="pending" className="align-middle" /> or further along, it&apos;s locked.
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-2"><CardTitle className="font-heading text-sm font-bold">Handling a rejection</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Open the rejected request, read the Reviewer Comment, then use the Revise &amp; Resubmit card: click <UI>Edit</UI> to fix it, then <UI>Resubmit</UI> to send it back into approval from the start.
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60">
            <CardHeader className="pb-3"><CardTitle className="font-heading text-base font-bold">Understanding expense status</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-2.5 font-semibold">Status</th>
                      <th className="px-5 py-2.5 font-semibold">What it means</th>
                      <th className="px-5 py-2.5 font-semibold">What happens next</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { s: "draft" as const, m: "You've started it but haven't submitted it. Only you can see or edit it.", n: "Nothing, until you submit it." },
                      { s: "pending" as const, m: "It's been submitted and is waiting for a decision.", n: "A manager and/or finance reviewer approves or rejects it (or it auto-approves instantly if it's small enough)." },
                      { s: "approved" as const, m: "A reviewer signed off on it.", n: "If you paid personally, Finance or an Admin still needs to mark it Paid." },
                      { s: "rejected" as const, m: "A reviewer turned it down, with a reason.", n: "You can revise it and resubmit." },
                      { s: "paid" as const, m: "Finance or an Admin has recorded that payment was made.", n: "Nothing further — this is the end of the line." },
                    ].map((row) => (
                      <tr key={row.s} className="border-b border-border/40 last:border-0 align-top">
                        <td className="px-5 py-3"><RequestStatusBadge status={row.s} /></td>
                        <td className="px-5 py-3 text-muted-foreground">{row.m}</td>
                        <td className="px-5 py-3 text-muted-foreground">{row.n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-5 pt-4">
                <Callout tone="info">
                  A request can also <b>auto-approve instantly</b>, with no reviewer, if it&apos;s under your organization&apos;s auto-approve threshold. The request&apos;s Approval Chain panel says so explicitly when this happens.
                </Callout>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="font-heading text-sm font-bold">Tracking expenses</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>On <UI>Requests</UI>: use the status tabs (each showing a count), the search box (matches request number, purpose, or vendor), and the <UI>Category</UI> filter. Click any row to open its full detail, receipts, approval chain and timeline.</p>
              <Callout tone="tip">The search box matches the request number, the purpose text, <i>or</i> the vendor name — a rough memory of what it was for is often enough.</Callout>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* Approvals & Payments                                         */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="approvals" className="mt-5 flex flex-col gap-5">
          <Callout tone="info">
            Approving expenses is for <b>Managers, Finance and Admins</b>. If you&apos;re an Employee, <UI>Approvals</UI> won&apos;t appear in your menu — track your own submissions from <UI>Requests</UI> instead.
          </Callout>

          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="font-heading text-sm font-bold">How approvals are routed</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 flex flex-col gap-1.5 text-sm text-muted-foreground">
                <li><b className="text-foreground">Managers</b> only see and can approve requests from people in <b>their own department</b>.</li>
                <li><b className="text-foreground">Finance and Admin</b> can see and approve <b>any</b> pending request.</li>
                <li>You can never approve your own request, no matter your role.</li>
                <li>Depending on your organization&apos;s settings, a request may need manager approval, finance review, or both — and anything above a set amount always gets a finance review. Requests below the auto-approve threshold skip this entirely.</li>
              </ul>
            </CardContent>
          </Card>

          <Task title="How to approve" when="You've been notified (or you see it on Approvals) and you're satisfied it's a legitimate business expense.">
            <ol>
              <li>Click <UI>Approvals</UI> in the left menu.</li>
              <li>Optionally click <UI>View Details</UI> to see the full request first.</li>
              <li>Click <UI>Approve</UI> — you can add an optional comment first from the request&apos;s own page.</li>
            </ol>
            <Field>What happens next</Field>
            <p>The request becomes <RequestStatusBadge status="approved" className="align-middle" />, the employee is notified, and it now waits for Finance or an Admin to process payment.</p>
          </Task>

          <Task title="How to reject">
            <ol>
              <li>Click <UI>Reject</UI> on the request (from <UI>Approvals</UI> or its detail page).</li>
              <li>Explain why — this is required, Monytar won&apos;t let you reject without a reason.</li>
              <li>Click <UI>Reject request</UI> (or <UI>Confirm Rejection</UI>) to finish.</li>
            </ol>
            <Field>What happens next</Field>
            <p>The request becomes <RequestStatusBadge status="rejected" className="align-middle" />, and the employee sees your reason and can revise and resubmit it.</p>
          </Task>

          <Callout tone="info">
            <b>Getting paid back (Reimbursement).</b> Monytar doesn&apos;t automatically wire money to anyone. &quot;Processing payment&quot; means <b>recording that your company already paid the person back</b> outside Monytar — by bank transfer, check, cash, or however your finance team actually pays.
          </Callout>

          <Task title="How to process a payment" when="A request is Approved and Finance/Admin can now do this.">
            <ol>
              <li>Open the approved request and click <UI>Process Payment</UI>.</li>
              <li>Enter a <UI>Payment Reference</UI> — required (e.g. a bank transfer ID like <code>TXN-12345</code>).</li>
              <li>Choose the <UI>Payment Method</UI>: Bank Transfer, Credit Card, Check, or Cash.</li>
              <li>Click <UI>Confirm Payment</UI>.</li>
            </ol>
            <Field>What happens next</Field>
            <p>The request becomes <RequestStatusBadge status="paid" className="align-middle" />, recorded permanently. The employee is notified.</p>
          </Task>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* Vendors, Departments, Reports, Notifications, Search         */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="resources" className="mt-5 flex flex-col gap-5">
          <Card className="border-border/60">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              <CardTitle className="font-heading text-sm font-bold">Vendors</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground flex flex-col gap-2">
              <p>A vendor is anyone your organization pays. Everyone can view and use vendors on requests; <b className="text-foreground">Admin, Finance and Manager</b> can add and manage them.</p>
              <p><b className="text-foreground">To add one:</b> click <UI>Add vendor</UI>, enter the <UI>Name</UI> (required, unique) and any optional details, then click <UI>Add vendor</UI> again. New vendors are automatically Approved and instantly selectable on requests.</p>
              <p>Toggle a vendor&apos;s Approved/Pending status on its card. Click the archive icon to <UI>Archive</UI> one you no longer use — it stays on past requests but can&apos;t be picked for new ones. Restore it any time with <UI>Show archived</UI>.</p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <CardTitle className="font-heading text-sm font-bold">Departments and budgets</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground flex flex-col gap-2">
              <p>A department groups people and gives them a spending budget Monytar tracks against. Employees don&apos;t have access to this page; Managers can view it; <b className="text-foreground">Admin and Finance</b> manage it (assigning people is Admin-only).</p>
              <p>Each department card shows a progress bar against its budget — green while under the warning threshold, amber at <b>Warning</b>, red at <b>Critical</b> or <b>Over budget</b> (typical defaults: 75% / 90% / 100%, set by your organization).</p>
              <p><b className="text-foreground">To create one:</b> click <UI>Add department</UI>, enter a <UI>Name</UI> and a <UI>Budget</UI> (enter 0 to track with no real limit), pick a <UI>Budget period</UI>, optionally assign a <UI>Manager</UI>, then click <UI>Create department</UI>.</p>
              <p>Click <UI>Members</UI> on a card to add or remove people (Admin only). Click <UI>Archive</UI> to retire a department — it stays on past requests and reports, but can&apos;t be picked for new ones.</p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <CardTitle className="font-heading text-sm font-bold">Reports</CardTitle>
              <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Finance &amp; Admin</span>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground flex flex-col gap-2">
              <p>Click <UI>Reports</UI> for summary totals over a date range you pick, plus four tabs: <b>Overview</b>, <b>Categories</b>, <b>Departments</b>, and <b>Vendors</b>.</p>
              <p>Click <UI>Export</UI>, then <UI>Download CSV</UI> (spreadsheet-ready) or <UI>Print / Save as PDF</UI> — both reflect whichever date range is currently selected.</p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-border/60">
              <CardHeader className="pb-2"><CardTitle className="font-heading text-sm font-bold">Notifications</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Click the bell icon or <UI>Notifications</UI>. Click one to mark it read — if it&apos;s about a request, it also opens that request. <UI>Mark all read</UI> clears everything at once; tabs filter by type.
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-2"><CardTitle className="font-heading text-sm font-bold">Searching Monytar</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Press <UI>Ctrl+K</UI> (Windows/Linux) or <UI>⌘K</UI> (Mac) anywhere, or click <UI>Search…</UI> in the top bar, to jump to a page or find a request, vendor, user, or department by name.
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* Settings & Admin                                             */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="settings" className="mt-5 flex flex-col gap-5">
          <Card className="border-border/60">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-primary" />
              <CardTitle className="font-heading text-sm font-bold">Your profile and settings</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground flex flex-col gap-2">
              <p><b className="text-foreground">Profile tab</b> — update your <UI>Full name</UI> and click <UI>Save Changes</UI>. Your <UI>Email</UI> is your sign-in identity and can&apos;t be changed here. Under Security, change your password (enter your current one plus a new 8+ character one) — you may be asked for a confirmation code emailed to you.</p>
              <p><b className="text-foreground">Organization tab</b> — everyone can see it; <b className="text-foreground">Admin and Finance</b> can change the logo, the organization&apos;s <UI>Default Currency</UI>, expense categories (Starter plan or higher), and the approval workflow thresholds (auto-approve, receipt requirement, finance review).</p>
              <p><b className="text-foreground">Notifications tab</b> — turn email notifications on/off and pick a digest frequency.</p>
              <p><b className="text-foreground">Appearance tab</b> — pick <UI>Light</UI>, <UI>Dark</UI>, or <UI>System</UI>.</p>
              <p><b className="text-foreground">Billing tab</b> — <UI>Manage Billing</UI> opens Stripe&apos;s secure portal; <UI>Change Plan</UI> switches plans; <UI>Cancel Subscription</UI> moves you to Free at the end of the billing period.</p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <CardTitle className="font-heading text-sm font-bold">Admin guide</CardTitle>
              <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Admin only, except billing</span>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground flex flex-col gap-2">
              <p><b className="text-foreground">Inviting someone:</b> click <UI>Users</UI> → <UI>Invite user</UI>, enter their email, pick a role and optional department, then <UI>Send invitation</UI>. If you&apos;re inviting a Manager, assign them a department so they can actually approve their team&apos;s requests. Until they accept, they appear under Pending invitations, where you can copy the link or revoke it.</p>
              <p><b className="text-foreground">Editing someone:</b> click <UI>Edit</UI> to change their role or department. You can&apos;t change your own role, and you can&apos;t demote the organization&apos;s only active admin.</p>
              <p><b className="text-foreground">Deactivating someone:</b> click <UI>Deactivate</UI> to revoke access immediately (their past requests stay on record); <UI>Reactivate</UI> restores it at any time.</p>
              <p>Departments, vendors, categories and org settings are managed from the pages above.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* FAQ / Troubleshooting / Glossary                             */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="faq" className="mt-5 flex flex-col gap-5">
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="font-heading text-base font-bold">&quot;What should I do?&quot;</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="px-1">
                {[
                  { q: "I paid for something myself.", a: <>Go to <UI>Requests</UI> → <UI>New request</UI>, fill it in, attach your receipt, and click <UI>Submit for Approval</UI>. Once it&apos;s Approved, Finance/Admin will mark it Paid once you&apos;ve actually been reimbursed.</> },
                  { q: "My expense was rejected.", a: <>Open it, read the Reviewer Comment, click <UI>Edit</UI> to fix it, then click <UI>Resubmit</UI>.</> },
                  { q: "I forgot to attach my receipt.", a: <>If it&apos;s still Draft or Rejected, open it, click <UI>Edit</UI>, and add it under Add More Receipts. If it&apos;s already further along, ask your reviewer or Finance/Admin for help.</> },
                  { q: "I need to find an old expense.", a: <>Go to <UI>Requests</UI> and use the search box and filters, or press <UI>Ctrl+K</UI> / <UI>⌘K</UI> from anywhere.</> },
                  { q: "I need to approve an expense.", a: <>Go to <UI>Approvals</UI> (Manager, Finance or Admin only) and click <UI>Approve</UI> or <UI>Reject</UI>.</> },
                  { q: "I need to pay someone back.", a: <>Open their Approved request and click <UI>Process Payment</UI> (Finance/Admin only).</> },
                  { q: "I want to change the currency amounts show in.", a: <>Go to <UI>Settings → Organization</UI> and change <UI>Default Currency</UI> (Admin/Finance only — it affects the whole organization).</> },
                  { q: "I need to add a new teammate.", a: <>Go to <UI>Users → Invite user</UI> (Admin only).</> },
                  { q: "A request I should approve isn't showing up.", a: <>Check your department — Managers only see requests from people in their <i>own</i> department. Otherwise, only Finance or an Admin can approve it.</> },
                ].map((item, i) => (
                  <AccordionItem key={i} value={`q-${i}`}>
                    <AccordionTrigger className="text-sm font-semibold text-left">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="font-heading text-base font-bold">Troubleshooting</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="px-1">
                {[
                  {
                    q: "I can't submit my expense.",
                    a: (
                      <>
                        <p className="mb-1.5">Check that:</p>
                        <ul className="list-disc pl-5 flex flex-col gap-1">
                          <li>Both <UI>Amount</UI> and <UI>Business Justification</UI> are filled in.</li>
                          <li>If a receipt is required above your amount, one is attached — or <UI>Save as Draft</UI> instead.</li>
                          <li>The amount is a positive number.</li>
                        </ul>
                        <p className="mt-2">Still stuck? Read the message at the bottom of the screen — Monytar explains what went wrong. A connection-related message means checking your internet and retrying.</p>
                      </>
                    ),
                  },
                  { q: "I don't see a button or page I need.", a: <>Almost always your role. Check who you&apos;re signed in as at the bottom of the left menu — pages like <UI>Approvals</UI>, <UI>Departments</UI>, <UI>Users</UI> and <UI>Reports</UI> are role-gated, and landing on one directly explains which role is needed.</> },
                  { q: "My teammate's invitation isn't working.", a: <>Check <UI>Users → Pending invitations</UI>. If it&apos;s expired, revoke and resend. If the email never arrived, use <UI>Copy link</UI> and share it directly.</> },
                  { q: "I can't change my password.", a: <>Make sure your new password is at least 8 characters, and that your <i>current</i> password is correct first. If a confirmation code is required, check your email (including spam).</> },
                  { q: "The amounts look wrong or in the wrong currency.", a: <>Amounts always show your organization&apos;s configured currency. Ask an Admin or Finance user to fix it under <UI>Settings → Organization → Currency</UI>.</> },
                  { q: "A department's budget shows as red / over budget.", a: <>Not an error — spending crossed a threshold. Talk to that department&apos;s manager or Finance; Monytar flags it but doesn&apos;t block new requests because of it.</> },
                ].map((item, i) => (
                  <AccordionItem key={i} value={`t-${i}`}>
                    <AccordionTrigger className="text-sm font-semibold text-left">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="font-heading text-base font-bold">Glossary</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {[
                  ["Request", "The record of one expense, from creation through payment."],
                  ["Reimbursement", "Getting money back for a business expense you paid for yourself."],
                  ["Draft", "A request started but not yet submitted."],
                  ["Auto-approve threshold", "The amount under which a request skips approval entirely."],
                  ["Approval chain", "The sequence of people/roles who need to sign off before a request is approved."],
                  ["Vendor", "A company or person your organization pays."],
                  ["Department", "A team with its own spending budget."],
                  ["Budget period", "How often a department's budget resets — Monthly, Quarterly, or Yearly."],
                  ["Payment reference", "The identifier (e.g. a bank transfer ID) recorded when a request is marked Paid."],
                  ["Category", "The type of expense — Travel, Meals & Entertainment, Software & Services, Equipment, Office Supplies, Other, or a custom one."],
                ].map(([term, def]) => (
                  <div key={term}>
                    <dt className="font-heading font-bold text-foreground">{term}</dt>
                    <dd className="text-muted-foreground mt-0.5">{def}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center pb-2">
            Still stuck? Ask an admin in your organization, or{" "}
            <Link href="/contact" className="text-primary hover:underline font-medium">contact Monytar support</Link>.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
