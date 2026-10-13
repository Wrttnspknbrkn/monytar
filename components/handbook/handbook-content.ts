import { Send, ShieldCheck, Banknote, type LucideIcon } from "lucide-react"
import type { UserRole } from "@/lib/types"

/**
 * Everything the public Monytar Handbook says lives here (plus guide-data.ts).
 *
 * RULE: this is shared outside the company. Write only what a person using the
 * product can already see on their own screen — what a button does, who can do
 * what. Never describe how Monytar is built or run: no technology, vendors,
 * infrastructure, security design, internal numbers, customer names or real
 * people/emails. tests/handbook-safe.test.ts fails the build if a banned term
 * slips in.
 */

export const HANDBOOK_UPDATED = "September 2026"
export const PDF_HREF = "/downloads/Monytar-Handbook.pdf"

export const HERO = {
  kicker: "Monytar Handbook",
  title: "Expenses, from receipt to reimbursement.",
  sub: "A five-minute tour of how Monytar works — for the people who spend, the people who approve, and the people who keep the books.",
}

export const SHOWCASE: { image: string; caption: string }[] = [
  { image: "nav-identity", caption: "Your menu shows exactly what your role can do" },
  { image: "requests-list", caption: "Every expense, with its status, in one place" },
  { image: "approvals", caption: "Approvers see what's waiting — and decide in a click" },
]

export interface StartStep {
  /** Screenshot in /public/images/help and the numbered marker on it to spotlight. */
  image: string
  marker: number
  title: string
  text: string
}

export interface StartPath {
  id: "company" | "invited"
  label: string
  who: string
  line: string
  steps: StartStep[]
  /** Shown after the last step. */
  done: string
}

/** How people get into Monytar. Mirrors the real sign-up and invitation screens. */
export const START_PATHS: StartPath[] = [
  {
    id: "company",
    label: "Set up my company",
    who: "For the person opening the account",
    line: "Four short steps, then invite your team. You become the Admin.",
    steps: [
      { image: "start-signup-account", marker: 1, title: "Your details", text: "Enter your name, work email and a password of at least 8 characters." },
      { image: "start-signup-org", marker: 1, title: "Your organization", text: "Type your company's name. Team size is optional." },
      { image: "start-signup-plan", marker: 1, title: "Pick a plan", text: "Free is enough to start and covers up to 3 people. Paid plans add more people and continue to a payment step." },
      { image: "start-signup-email", marker: 1, title: "Confirm your email", text: "We send you a confirmation link. Click it, then sign in." },
      { image: "invite-user", marker: 1, title: "Invite your team", text: "Open Users, click Invite, then enter each person's work email, role and department." },
    ],
    done: "That's it. Your team gets an email and can join in a minute.",
  },
  {
    id: "invited",
    label: "I was invited",
    who: "For everyone joining a company",
    line: "Two minutes, from the email to your dashboard.",
    steps: [
      { image: "invite-user", marker: 4, title: "Your admin invites you", text: "They enter your work email and choose your role, then send the invitation. You get an email with a link." },
      { image: "start-invite-join", marker: 1, title: "Open the link", text: "You'll see the company's name and the role you've been given." },
      { image: "start-invite-join", marker: 2, title: "Add your name", text: "Type your full name." },
      { image: "start-invite-join", marker: 3, title: "Choose a password", text: "Use at least 8 characters. You'll use it every time you sign in." },
      { image: "start-invite-join", marker: 4, title: "Accept the invitation", text: "Click Accept invitation. If you're asked to confirm your email first, click the link we send, then sign in." },
    ],
    done: "You're in. Your dashboard is ready — try adding your first expense.",
  },
]

/** Small, useful next stops for anyone getting started. */
export const START_LINKS: { label: string; line: string; href: string }[] = [
  { label: "Sign in", line: "Already have an account?", href: "/login" },
  { label: "Forgot your password?", line: "Reset it by email.", href: "/forgot-password" },
  { label: "Try the demo", line: "Look around first.", href: "/demo" },
]

export interface LoopStep {
  n: number
  title: string
  who: string
  line: string
  icon: LucideIcon
}

export const LOOP: LoopStep[] = [
  { n: 1, title: "Submit", who: "You", line: "Say what you spent and why. Add the receipt.", icon: Send },
  { n: 2, title: "Approve", who: "Your manager or finance", line: "A reviewer says yes — or asks for a change.", icon: ShieldCheck },
  { n: 3, title: "Get paid back", who: "Finance", line: "Finance records the payment. You're done.", icon: Banknote },
]

export interface RoleCard {
  role: UserRole
  name: string
  line: string
  can: string[]
  menu: string[]
}

export const ROLE_CARDS: RoleCard[] = [
  {
    role: "employee",
    name: "Employee",
    line: "Spends for work and wants it back.",
    can: ["Add expenses", "Attach receipts", "Track status", "Fix and resubmit"],
    menu: ["Dashboard", "Requests", "Vendors", "Notifications", "Settings", "Help"],
  },
  {
    role: "manager",
    name: "Manager",
    line: "Keeps a team's spending in check.",
    can: ["Everything an Employee can", "Approve their department", "Watch team budgets"],
    menu: ["+ Approvals", "+ Departments"],
  },
  {
    role: "finance",
    name: "Finance",
    line: "Keeps the books straight.",
    can: ["Everything a Manager can", "Approve any request", "Record payments", "Run reports", "Set approval rules"],
    menu: ["+ Reports"],
  },
  {
    role: "admin",
    name: "Admin",
    line: "Runs Monytar for the company.",
    can: ["Everything above", "Invite and manage people", "Set up departments", "Company settings"],
    menu: ["+ Users"],
  },
]

/** The interactive approval-rules example. Amounts are illustrative only. */
export const EXAMPLE_RULES = {
  autoApproveUnder: 50,
  receiptFrom: 100,
  financeReviewFrom: 2000,
  max: 5000,
}

export const EXAMPLE_AMOUNTS: { label: string; amount: number }[] = [
  { label: "Coffee for a client", amount: 30 },
  { label: "Taxi to the airport", amount: 140 },
  { label: "Team lunch", amount: 650 },
  { label: "New laptop", amount: 4500 },
]

export interface TourScreen {
  image: string
  title: string
  looks: string[]
}

export const TOUR: TourScreen[] = [
  { image: "nav-identity", title: "Your dashboard", looks: ["A menu that fits your role", "Your name, role and department", "One click to add an expense"] },
  { image: "requests-list", title: "Requests", looks: ["Tabs for each status", "Search by number, purpose or vendor", "A button to start a new request"] },
  { image: "new-request", title: "Adding an expense", looks: ["The amount you paid", "A category that fits", "A short reason", "Receipt upload right on the form", "Save as Draft, or Submit for Approval"] },
  { image: "approvals", title: "Approvals", looks: ["Search what's waiting for you", "Approve in one click", "A reason is required to reject", "View the details and receipt first"] },
  { image: "departments", title: "Budgets by department", looks: ["Add a department with a budget", "Green, amber, then red as it fills", "See who's in each team"] },
  { image: "reports", title: "Reports", looks: ["Any period, or your own dates", "Export to CSV or PDF", "Tabs for categories, teams and vendors"] },
]

export const TIPS: { title: string; line: string }[] = [
  { title: "Snap the receipt now", line: "Photograph it while you're still holding it. It's the one thing people lose." },
  { title: "Say why, not just what", line: "“Fuel for the Kumasi client visit” gets approved faster than “Fuel”." },
  { title: "Pick the closest category", line: "Good categories make reports useful later." },
  { title: "Submit soon after spending", line: "Fresh expenses get approved quickly. Old ones raise questions." },
  { title: "Check the status, don't chase", line: "Open Requests to see exactly where an expense is." },
]

export const CLOSING = {
  title: "Ready to try it?",
  line: "Your administrator adds you to Monytar. Once you're in, sign in and add your first expense — it takes a minute.",
}
