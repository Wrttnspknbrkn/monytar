import { noindexMetadata } from "@/lib/seo"

export const metadata = noindexMetadata("Accept your invitation")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
