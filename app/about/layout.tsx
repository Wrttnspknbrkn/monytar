import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "About Monytar",
  description: "Meet the team building Monytar, the expense management platform that makes requests, approvals and budgets simple for growing organizations.",
  path: "/about",
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
