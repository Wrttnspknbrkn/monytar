import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Pricing",
  description: "Simple, transparent Monytar pricing. Start free, then upgrade as your team grows. Compare plans for expense requests, approvals, budgets and reports.",
  path: "/pricing",
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
