import { noindexMetadata } from "@/lib/seo"

export const metadata = noindexMetadata("Choose a new password")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
