import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Contact Us",
  description: "Talk to the Monytar team about pricing, a demo or support. We usually reply within 24 hours.",
  path: "/contact",
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
