import {
  PlusCircle,
  ListChecks,
  RotateCcw,
  Compass,
  CheckCircle2,
  Banknote,
  BarChart3,
  Building2,
  UserPlus,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react"
import type { UserRole } from "@/lib/types"
import type { RequestStatus } from "@/lib/types"

/** Keep every string short. If a step needs a paragraph, the screen is the better teacher. */

export interface GuideTask {
  id: string
  title: string
  /** One short line shown on the tile. */
  blurb: string
  icon: LucideIcon
  roles: UserRole[]
  /** Base name of the screenshot in /public/images/help and its entry in markers.json. */
  image: string
  /** One step per numbered marker on the screenshot, in order. */
  steps: string[]
  tip?: string
  /** Where "Open it now" takes the person. */
  href: string
  openLabel: string
}

const ALL: UserRole[] = ["employee", "manager", "finance", "admin"]

export const TASKS: GuideTask[] = [
  {
    id: "add-expense",
    title: "Add an expense",
    blurb: "Record something you paid for",
    icon: PlusCircle,
    roles: ALL,
    image: "new-request",
    steps: [
      "Type the amount you paid.",
      "Pick the category that fits best.",
      "Say what it was for and why.",
      "Attach a photo or PDF of the receipt.",
      "Click Submit for Approval — or Save as Draft to finish later.",
    ],
    tip: "Not ready? Save as Draft. Nobody sees it until you submit.",
    href: "/requests/new",
    openLabel: "Add an expense",
  },
  {
    id: "track-expenses",
    title: "Track my expenses",
    blurb: "See what's pending, approved or paid",
    icon: ListChecks,
    roles: ALL,
    image: "requests-list",
    steps: [
      "Use the tabs to filter by status.",
      "Search by number, purpose or vendor.",
      "Need another one? Click New request.",
    ],
    tip: "Click any row to see its full history.",
    href: "/requests",
    openLabel: "Open Requests",
  },
  {
    id: "fix-rejected",
    title: "Fix a rejected expense",
    blurb: "Change it and send it again",
    icon: RotateCcw,
    roles: ALL,
    image: "rejected-request",
    steps: [
      "Rejected means the reviewer needs a change.",
      "Read the reviewer's comment to see what.",
      "Click Edit, fix it, then click Resubmit.",
    ],
    tip: "Resubmitting sends it back through approval from the start.",
    href: "/requests?status=rejected",
    openLabel: "Show rejected",
  },
  {
    id: "find-way",
    title: "Find my way around",
    blurb: "Menu, your role, quick actions",
    icon: Compass,
    roles: ALL,
    image: "nav-identity",
    steps: [
      "The menu lists every page your role can use.",
      "Check your name, role and department here.",
      "Add an expense from anywhere with this button.",
    ],
    tip: "Press Ctrl+K (⌘K on Mac) to search everything.",
    href: "/dashboard",
    openLabel: "Go to Dashboard",
  },
  {
    id: "approve",
    title: "Approve or reject",
    blurb: "Review what's waiting for you",
    icon: CheckCircle2,
    roles: ["manager", "finance", "admin"],
    image: "approvals",
    steps: [
      "Search the requests waiting for you.",
      "Click Approve if it looks right.",
      "Click Reject — you must give a reason.",
      "View Details to check receipts first.",
    ],
    tip: "Managers see their own department. Finance and Admin see everyone's.",
    href: "/approvals",
    openLabel: "Open Approvals",
  },
  {
    id: "pay",
    title: "Pay an approved expense",
    blurb: "Record that the money was sent",
    icon: Banknote,
    roles: ["finance", "admin"],
    image: "process-payment",
    steps: [
      "Enter the payment reference, like a transfer ID.",
      "Choose how it was paid.",
      "Click Confirm Payment. The request becomes Paid.",
    ],
    tip: "This records a payment you've already made. Monytar doesn't move money.",
    href: "/requests?status=approved",
    openLabel: "Show approved",
  },
  {
    id: "reports",
    title: "See reports",
    blurb: "Spending by category, team and vendor",
    icon: BarChart3,
    roles: ["finance", "admin"],
    image: "reports",
    steps: [
      "Pick a period, or choose your own dates.",
      "Export as CSV or print to PDF.",
      "Switch tabs for categories, departments and vendors.",
    ],
    href: "/reports",
    openLabel: "Open Reports",
  },
  {
    id: "budgets",
    title: "Check department budgets",
    blurb: "Who's spent how much",
    icon: Building2,
    roles: ["manager", "finance", "admin"],
    image: "departments",
    steps: [
      "Add a department, with a budget (Admin or Finance).",
      "The bar shows spend against budget: green, amber, then red.",
      "Members shows who's in the team.",
    ],
    tip: "Going over budget is flagged, never blocked.",
    href: "/departments",
    openLabel: "Open Departments",
  },
  {
    id: "invite",
    title: "Invite a teammate",
    blurb: "Give someone access",
    icon: UserPlus,
    roles: ["admin"],
    image: "invite-user",
    steps: [
      "Enter their work email.",
      "Choose their role.",
      "Pick their department. Managers need one to approve.",
      "Click Send invitation. They set their own password.",
    ],
    tip: "Email didn't arrive? Copy the invite link from Pending invitations.",
    href: "/users",
    openLabel: "Open Users",
  },
  {
    id: "rules",
    title: "Set approval rules",
    blurb: "Decide what needs a review",
    icon: SlidersHorizontal,
    roles: ["finance", "admin"],
    image: "approval-rules",
    steps: [
      "Amounts under this skip approval entirely.",
      "Above this, a receipt is required.",
      "At or above this, Finance always reviews.",
      "Click Save Changes.",
    ],
    href: "/settings",
    openLabel: "Open Settings",
  },
]

/**
 * Whose guides a person may read. You see your own role's guide and the guides
 * of the roles below you, never the ones above (an Employee has no need for the
 * Admin walkthroughs). Finance sits between Manager and Admin: it can do
 * everything a Manager can, but not Admin-only things like inviting people.
 */
export const VISIBLE_ROLES: Record<UserRole, UserRole[]> = {
  employee: ["employee"],
  manager: ["employee", "manager"],
  finance: ["employee", "manager", "finance"],
  admin: ["employee", "manager", "finance", "admin"],
}

/** Tasks shown when reading the guide "as" a role. */
export function tasksForRole(role: UserRole): GuideTask[] {
  return TASKS.filter((t) => t.roles.includes(role))
}

/** True if a viewer may open this task at all — used to guard ?task= deep links and "Show me how" buttons. */
export function canViewTask(viewer: UserRole, task: GuideTask): boolean {
  return task.roles.some((r) => VISIBLE_ROLES[viewer].includes(r))
}

export const ROLE_TAGLINE: Record<UserRole, string> = {
  employee: "Submit and track your own expenses",
  manager: "Also approve your department's expenses",
  finance: "Also approve anything, record payments, run reports",
  admin: "Everything, plus people, departments and settings",
}

export interface JourneyStage {
  id: "draft" | "pending" | "approved" | "paid"
  status: RequestStatus
  who: string
  means: string
  next: string
}

export const JOURNEY: JourneyStage[] = [
  { id: "draft", status: "draft", who: "You", means: "Started, not sent yet. Only you can see it.", next: "Finish it, then Submit for Approval." },
  { id: "pending", status: "pending", who: "Manager / Finance", means: "Sent. Waiting for a decision.", next: "Nothing. You'll be notified. Small amounts may auto-approve." },
  { id: "approved", status: "approved", who: "Finance / Admin", means: "A reviewer said yes.", next: "Finance records the payment." },
  { id: "paid", status: "paid", who: "Done", means: "Payment recorded. All finished.", next: "Nothing more to do." },
]

export const REJECTED_INFO = {
  status: "rejected" as RequestStatus,
  means: "A reviewer said no, and left a reason.",
  next: "Open it, read the comment, click Edit, then Resubmit.",
}

export interface Faq {
  q: string
  a: string
  /** Extra words people might type. */
  keywords: string
  taskId?: string
}

export const FAQS: Faq[] = [
  {
    q: "How do I create a Monytar account?",
    a: "Choose Sign up, enter your name, work email and a password, name your organization, pick a plan and confirm your email. You become the Admin and can invite your team.",
    keywords: "sign up signup register create account start new company organization admin",
  },
  {
    q: "I was invited. How do I join?",
    a: "Open the link in your invitation email, type your name, choose a password and click Accept invitation. You'll land on your dashboard.",
    keywords: "invitation invited join accept link email new employee",
  },
  {
    q: "My confirmation or invitation link doesn't work.",
    a: "Links expire and work once. If your email is already confirmed, just sign in. If an invitation has expired, ask your admin to send a new one.",
    keywords: "expired link invalid confirm confirmation invitation not working new again",
  },
  { q: "Can I see a specific period, like last year?", a: "Yes. On Reports and the Dashboard, click the date range button. Pick a ready-made period or choose your own dates. There is no limit on how far back you can go.", keywords: "date range period custom dates last year month quarter filter from to older history", taskId: "reports" },
  { q: "What are payment terms on a vendor?", a: "How long you have to pay that vendor after they send their invoice. Net 30 means within 30 days; Due on receipt means straight away. It's a note for your records and doesn't change how requests are approved.", keywords: "vendor payment terms net 30 net 15 due invoice supplier" },
  { q: "I paid for something myself", a: "Add an expense and attach the receipt. Once approved, Finance records your payment.", keywords: "reimburse refund paid pocket money back", taskId: "add-expense" },
  { q: "My expense was rejected", a: "Open it, read the comment, click Edit, then Resubmit.", keywords: "declined denied turned down again", taskId: "fix-rejected" },
  { q: "I forgot my receipt", a: "If it's still a Draft or Rejected, click Edit and add it. Once Pending, ask your reviewer.", keywords: "attach upload missing photo invoice" },
  { q: "I can't submit", a: "Amount and reason are required. Over the receipt limit? Attach one, or Save as Draft.", keywords: "error stuck button disabled fails cannot" },
  { q: "Where is Approvals (or Reports, Users)?", a: "Some pages depend on your role. Check your role at the bottom of the menu.", keywords: "missing menu page cannot see access permission" },
  { q: "I can't approve a request", a: "Managers only approve their own department's requests, and never their own.", keywords: "manager department approve cannot missing", taskId: "approve" },
  { q: "How do I find an old expense?", a: "Search on the Requests page, or press Ctrl+K anywhere.", keywords: "search filter old history look up", taskId: "track-expenses" },
  { q: "Amounts show the wrong currency", a: "Admin or Finance can change it in Settings → Organization → Currency.", keywords: "dollar cedi ghs usd money symbol" },
  { q: "I forgot my password", a: "On the sign-in page, click Forgot? and we'll email you a reset link.", keywords: "login sign in reset locked" },
  { q: "Is a department over budget a problem?", a: "No. It's flagged in red, but nothing is blocked.", keywords: "red warning critical limit", taskId: "budgets" },
]

export const GLOSSARY: { term: string; def: string }[] = [
  { term: "Request", def: "One expense you've recorded, from start to payment." },
  { term: "Reimbursement", def: "Getting back money you spent for work." },
  { term: "Draft", def: "Saved but not sent. Only you can see it." },
  { term: "Approval chain", def: "Who must say yes: manager, then finance, or both." },
  { term: "Auto-approve", def: "Small amounts your company lets through with no review." },
  { term: "Vendor", def: "A company or person your business pays." },
  { term: "Department", def: "A team with its own spending budget." },
  { term: "Payment reference", def: "The ID of the payment, like a transfer number." },
]
