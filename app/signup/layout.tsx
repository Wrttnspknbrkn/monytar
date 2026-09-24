import { noindexMetadata } from "@/lib/seo"

export const metadata = noindexMetadata("Create your account")

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
