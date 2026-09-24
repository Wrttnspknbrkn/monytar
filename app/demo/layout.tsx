import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Try the Demo",
  description: "Try Monytar in a live demo. Pick a role and explore expense requests, approvals, budgets and reports.",
  path: "/demo",
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
