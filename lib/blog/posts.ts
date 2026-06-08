// Blog content layer for Monytar.
// This module is the single source of truth for editorial content. It is
// structured so it can later be swapped for a headless CMS (Sanity, Contentful,
// Notion, etc.) without changing any consuming components. Every consumer reads
// through the exported query functions, never the raw arrays.

export type BlogCategory =
  | "Product"
  | "Finance Operations"
  | "Spend Management"
  | "Company Building"
  | "Engineering"

export interface BlogAuthor {
  id: string
  name: string
  role: string
  avatar: string
  bio: string
}

export interface BlogContentBlock {
  type: "paragraph" | "heading" | "list" | "quote" | "callout"
  // For headings, `text` is the heading content and `id` is the anchor slug.
  text?: string
  id?: string
  // For list blocks.
  items?: string[]
  // For quote blocks.
  attribution?: string
}

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  category: BlogCategory
  tags: string[]
  authorId: string
  publishedAt: string // ISO date
  updatedAt?: string
  coverImage: string
  featured: boolean
  // Estimated reading time is derived, but stored for stable SSR output.
  readingMinutes: number
  content: BlogContentBlock[]
}

export const authors: BlogAuthor[] = [
  {
    id: "richmond-asare",
    name: "Richmond Asare",
    role: "Team Lead",
    avatar: "/images/team/richmond.png",
    bio: "Richmond leads product and strategy at Monytar. He writes about finance operations, spend culture, and building software that finance teams actually enjoy using.",
  },
  {
    id: "kelvin-fameyeh",
    name: "Kelvin Fameyeh",
    role: "Software Developer",
    avatar: "/images/team/kelvin.png",
    bio: "Kelvin builds the systems behind Monytar. He writes about engineering, reliability, and the technical decisions that keep financial data accurate and secure.",
  },
]

export const categories: { name: BlogCategory; description: string }[] = [
  { name: "Product", description: "Updates, releases, and the thinking behind how Monytar works." },
  { name: "Finance Operations", description: "Practical playbooks for closing the books and running a finance team." },
  { name: "Spend Management", description: "How modern teams control spend without slowing people down." },
  { name: "Company Building", description: "Lessons on growth, culture, and operating discipline." },
  { name: "Engineering", description: "How we build a reliable, secure financial platform." },
]

const posts: BlogPost[] = [
  {
    slug: "approval-workflows-that-people-actually-follow",
    title: "Approval workflows that people actually follow",
    excerpt:
      "Most approval processes fail because they were designed for control, not for the people doing the work. Here is how to build one that holds up.",
    category: "Spend Management",
    tags: ["approvals", "workflow", "finance teams"],
    authorId: "richmond-asare",
    publishedAt: "2026-05-28",
    coverImage: "/images/workflow.jpg",
    featured: true,
    readingMinutes: 7,
    content: [
      {
        type: "paragraph",
        text: "Every finance leader has inherited an approval process that looks reasonable on paper and falls apart in practice. Requests sit untouched for days. Managers approve things they never read. Employees learn to route around the system entirely. The problem is rarely the people. It is the design.",
      },
      {
        type: "heading",
        id: "start-with-the-decision",
        text: "Start with the decision, not the hierarchy",
      },
      {
        type: "paragraph",
        text: "The instinct when designing approvals is to mirror the org chart. A request travels up the reporting line until someone senior enough signs off. This feels safe, but it confuses authority with relevance. The person best placed to judge whether a purchase makes sense is usually the one closest to the work, not the one highest on the chart.",
      },
      {
        type: "paragraph",
        text: "A better starting point is the decision itself. Ask what actually needs to be verified before money moves: is the amount within budget, is the vendor approved, is the expense category allowed. Once you know what the approver is checking, the right approver becomes obvious.",
      },
      {
        type: "heading",
        id: "set-thresholds-deliberately",
        text: "Set thresholds deliberately",
      },
      {
        type: "paragraph",
        text: "Not every expense deserves the same scrutiny. A team lunch and a new server contract should not travel the same path. Thresholds let you match the level of review to the level of risk.",
      },
      {
        type: "list",
        items: [
          "Auto approve small, routine expenses that fall inside a known budget.",
          "Route mid sized requests to the direct manager who owns the budget line.",
          "Send large or unusual requests to finance for a second look.",
        ],
      },
      {
        type: "callout",
        text: "A good rule of thumb: if more than 80 percent of your requests require a human approval, your thresholds are too aggressive and people will start to ignore them.",
      },
      {
        type: "heading",
        id: "make-the-fast-path-the-default",
        text: "Make the fast path the default",
      },
      {
        type: "paragraph",
        text: "The single biggest predictor of whether a workflow survives is speed. If approvals are fast, people use the system. If they are slow, people find workarounds, and your control evaporates. Design for the common case first. The exceptions can wait.",
      },
      {
        type: "quote",
        text: "Controls that slow everyone down to catch a rare problem usually cost more than the problem they prevent.",
        attribution: "A finance lead we work with",
      },
      {
        type: "heading",
        id: "close-the-loop",
        text: "Close the loop",
      },
      {
        type: "paragraph",
        text: "Finally, tell people what happened. An approval that disappears into silence feels broken even when it worked. A simple notification, an updated status, a clear reason for a rejection. These small signals are what make a process feel trustworthy, and trust is what keeps people inside the system instead of around it.",
      },
    ],
  },
  {
    slug: "the-month-end-close-without-the-scramble",
    title: "The month end close without the scramble",
    excerpt:
      "Closing the books should be a routine, not a fire drill. A look at the habits that turn a stressful close into a predictable one.",
    category: "Finance Operations",
    tags: ["month end", "close", "reporting"],
    authorId: "richmond-asare",
    publishedAt: "2026-05-14",
    coverImage: "/images/dash3.jpg",
    featured: false,
    readingMinutes: 6,
    content: [
      {
        type: "paragraph",
        text: "Ask most finance teams how the close went and you will hear some version of the same story. A few quiet days, then a frantic week of chasing receipts, reconciling spreadsheets, and explaining variances nobody saw coming. It does not have to be this way.",
      },
      {
        type: "heading",
        id: "close-continuously",
        text: "Close a little every day",
      },
      {
        type: "paragraph",
        text: "The scramble happens because work piles up. Receipts that should have been captured at the moment of purchase get reconstructed weeks later from memory and bank statements. The fix is to move the work to the moment it happens. When an expense is submitted, categorized, and matched to a receipt in real time, the close becomes a review rather than a reconstruction.",
      },
      {
        type: "heading",
        id: "standardize-categories",
        text: "Standardize categories before you need them",
      },
      {
        type: "paragraph",
        text: "Inconsistent categorization is one of the quietest sources of close pain. When the same expense lands in three different buckets depending on who submitted it, every report needs manual cleanup. A short, well defined list of categories, enforced at submission, removes that cleanup entirely.",
      },
      {
        type: "list",
        items: [
          "Keep your category list short enough to memorize.",
          "Define each category with a one line description so there is no ambiguity.",
          "Review the list quarterly and retire categories nobody uses.",
        ],
      },
      {
        type: "heading",
        id: "watch-budgets-in-real-time",
        text: "Watch budgets in real time",
      },
      {
        type: "paragraph",
        text: "Variances are only surprises when you see them late. A department that quietly runs 30 percent over budget is a painful conversation at month end and a simple adjustment mid month. Real time budget tracking turns the close from a moment of discovery into a confirmation of what you already knew.",
      },
      {
        type: "callout",
        text: "If your close regularly produces surprises, the problem is not the close. It is the visibility you had during the month.",
      },
    ],
  },
  {
    slug: "why-we-built-monytar",
    title: "Why we built Monytar",
    excerpt:
      "Expense tools have been around for decades. Here is why we thought the category still had room for something better.",
    category: "Company Building",
    tags: ["story", "mission", "product"],
    authorId: "richmond-asare",
    publishedAt: "2026-04-30",
    coverImage: "/images/about-hero.jpg",
    featured: false,
    readingMinutes: 5,
    content: [
      {
        type: "paragraph",
        text: "Monytar started with a frustration that anyone who has run a growing team will recognize. The tools meant to give finance control were the same tools everyone quietly resented using. They were slow, rigid, and built as if the people submitting expenses were the enemy.",
      },
      {
        type: "heading",
        id: "the-gap",
        text: "The gap we kept running into",
      },
      {
        type: "paragraph",
        text: "On one end of the market you had spreadsheets. Flexible, free, and completely unable to scale past a handful of people. On the other end you had heavyweight enterprise suites that took months to implement and a specialist to operate. There was very little built for the team in the middle, the one that had outgrown the spreadsheet but did not want to take on enterprise complexity.",
      },
      {
        type: "heading",
        id: "what-we-wanted",
        text: "What we wanted to build",
      },
      {
        type: "list",
        items: [
          "A system an employee could learn in a minute and use in seconds.",
          "Controls a finance team could trust without policing every transaction.",
          "Reporting that answered questions instead of generating more.",
        ],
      },
      {
        type: "quote",
        text: "We wanted finance teams to feel like the software was on their side, and employees to barely notice it was there.",
        attribution: "Richmond Asare, Team Lead",
      },
      {
        type: "paragraph",
        text: "That balance, control for finance and simplicity for everyone else, is the line we walk with every decision we make. It is harder than picking a side. We think it is the only version worth building.",
      },
    ],
  },
  {
    slug: "department-budgets-that-guide-rather-than-block",
    title: "Department budgets that guide rather than block",
    excerpt:
      "A budget should be a steering wheel, not a brake. How to use department budgets to shape spending without grinding work to a halt.",
    category: "Spend Management",
    tags: ["budgets", "departments", "planning"],
    authorId: "richmond-asare",
    publishedAt: "2026-04-12",
    coverImage: "/images/dash4.png",
    featured: false,
    readingMinutes: 6,
    content: [
      {
        type: "paragraph",
        text: "There are two ways to run a budget. One treats it as a hard wall: spend up to the line and everything stops. The other treats it as a guide: a clear signal of where you stand, with room for judgment at the edges. The first feels safe. The second is what actually works.",
      },
      {
        type: "heading",
        id: "visibility-first",
        text: "Visibility before enforcement",
      },
      {
        type: "paragraph",
        text: "Most overspending is not reckless. It is invisible. A manager approves a string of reasonable requests with no clear sense of the cumulative total. By the time the budget is blown, the money is already gone. Showing the remaining budget at the moment of approval changes the decision while it can still be changed.",
      },
      {
        type: "heading",
        id: "thresholds-and-alerts",
        text: "Use thresholds and alerts",
      },
      {
        type: "list",
        items: [
          "Send a gentle alert at 75 percent of budget so there is time to adjust.",
          "Flag requests that would push a department over its limit, but allow an override with a reason.",
          "Review the overrides monthly. They are often the most useful signal you have.",
        ],
      },
      {
        type: "callout",
        text: "The goal of a budget is not to prevent every dollar of overspend. It is to make sure no overspend happens by accident.",
      },
    ],
  },
  {
    slug: "keeping-financial-data-accurate-and-secure",
    title: "Keeping financial data accurate and secure",
    excerpt:
      "A behind the scenes look at the engineering principles that keep Monytar's data correct, isolated, and protected.",
    category: "Engineering",
    tags: ["security", "architecture", "reliability"],
    authorId: "kelvin-fameyeh",
    publishedAt: "2026-03-22",
    coverImage: "/images/dash.jpg",
    featured: false,
    readingMinutes: 8,
    content: [
      {
        type: "paragraph",
        text: "Financial software has a different relationship with mistakes than most products. A glitch in a social app is an annoyance. A glitch in an expense platform can mean the wrong number on a report a board is about to read. That raises the bar for everything we build.",
      },
      {
        type: "heading",
        id: "isolation-by-default",
        text: "Tenant isolation by default",
      },
      {
        type: "paragraph",
        text: "Every organization on Monytar shares the same infrastructure, but no organization can ever see another's data. We enforce this at the database layer with row level security, so isolation does not depend on application code remembering to filter correctly. The rule lives where the data lives.",
      },
      {
        type: "heading",
        id: "defense-in-depth",
        text: "Defense in depth",
      },
      {
        type: "paragraph",
        text: "Security that relies on a single control is one bug away from failure. We layer checks instead. Requests are authenticated, then authorized by role, then scoped to the organization, then constrained again by database policy. Any one of these would catch a mistake the others missed.",
      },
      {
        type: "list",
        items: [
          "Authentication confirms who is making the request.",
          "Authorization confirms they are allowed to perform the action.",
          "Scoping confirms they can only touch their own organization's data.",
          "Database policies enforce all of the above one more time, independently.",
        ],
      },
      {
        type: "quote",
        text: "We assume every layer above the database might one day have a bug. The database is the layer that has to be right.",
        attribution: "Kelvin Fameyeh, Software Developer",
      },
      {
        type: "heading",
        id: "accuracy-as-a-feature",
        text: "Accuracy as a feature",
      },
      {
        type: "paragraph",
        text: "Beyond security, correctness is a feature people feel even when they cannot name it. Consistent currency handling, atomic status changes, and an audit trail for every action. These are the details that let a finance team trust a number without checking it twice, which is the entire point of the software.",
      },
    ],
  },
  {
    slug: "what-good-expense-policy-looks-like",
    title: "What a good expense policy looks like",
    excerpt:
      "The best expense policies are short, clear, and trusted. A practical guide to writing one your team will actually read.",
    category: "Finance Operations",
    tags: ["policy", "process", "culture"],
    authorId: "richmond-asare",
    publishedAt: "2026-03-05",
    coverImage: "/images/requests.png",
    featured: false,
    readingMinutes: 5,
    content: [
      {
        type: "paragraph",
        text: "Most expense policies are written to be defensible, not readable. They cover every edge case, anticipate every abuse, and run for pages nobody finishes. The result is a document that protects the company legally and helps the team not at all.",
      },
      {
        type: "heading",
        id: "write-for-the-honest-majority",
        text: "Write for the honest majority",
      },
      {
        type: "paragraph",
        text: "The vast majority of your team wants to do the right thing. They just need to know what it is. A policy written to stop the rare bad actor punishes everyone else with complexity. Write for the people who will follow the rules, and handle the exceptions as exceptions.",
      },
      {
        type: "list",
        items: [
          "State what is reimbursable in plain language.",
          "Give clear limits so nobody has to guess.",
          "Explain what to do when something falls outside the rules.",
        ],
      },
      {
        type: "callout",
        text: "If your team cannot summarize your expense policy from memory, it is too long to be useful.",
      },
      {
        type: "paragraph",
        text: "A good policy is a tool, not a shield. When people understand it, they follow it, and the whole system gets easier to run.",
      },
    ],
  },
]

// Derived helper: estimate reading time from content if not explicitly set.
function wordsIn(post: BlogPost): number {
  return post.content.reduce((total, block) => {
    if (block.text) total += block.text.split(/\s+/).length
    if (block.items) total += block.items.join(" ").split(/\s+/).length
    return total
  }, 0)
}

export function estimateReadingMinutes(post: BlogPost): number {
  if (post.readingMinutes) return post.readingMinutes
  return Math.max(1, Math.round(wordsIn(post) / 200))
}

// Query API. Consumers should only use these functions so the underlying
// storage can change later without touching components.

export function getAllPosts(): BlogPost[] {
  return [...posts].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
}

export function getFeaturedPost(): BlogPost {
  return getAllPosts().find((p) => p.featured) ?? getAllPosts()[0]
}

export function getRecentPosts(limit?: number): BlogPost[] {
  const all = getAllPosts().filter((p) => !p.featured)
  return typeof limit === "number" ? all.slice(0, limit) : all
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug)
}

export function getPostsByCategory(category: BlogCategory): BlogPost[] {
  return getAllPosts().filter((p) => p.category === category)
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getPostBySlug(slug)
  if (!current) return getRecentPosts(limit)
  const scored = getAllPosts()
    .filter((p) => p.slug !== slug)
    .map((p) => {
      let score = 0
      if (p.category === current.category) score += 2
      score += p.tags.filter((t) => current.tags.includes(t)).length
      return { post: p, score }
    })
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.post)
}

export function getAuthor(id: string): BlogAuthor {
  return authors.find((a) => a.id === id) ?? authors[0]
}

export function getAllCategories() {
  return categories
}

export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
