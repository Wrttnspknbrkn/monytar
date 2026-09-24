import { noindexMetadata } from "@/lib/seo"

export const metadata = noindexMetadata("Verify your email")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
