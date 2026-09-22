import type { Metadata } from "next"

export const metadata: Metadata = { title: { absolute: "Request Details | Monytar" } }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
