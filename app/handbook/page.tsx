import type { Metadata } from "next"
import { Handbook } from "@/components/handbook/handbook"

const description = "A short, interactive tour of how Monytar works: submit an expense, get it approved, get paid back."

export const metadata: Metadata = {
  title: "Monytar Handbook",
  description,
  // Shareable by link, but kept out of search results.
  robots: { index: false, follow: false },
  openGraph: {
    title: "Monytar Handbook",
    description,
    type: "website",
    images: [{ url: "/images/help/nav-identity.png", width: 1200, height: 760, alt: "Monytar dashboard" }],
  },
  twitter: { card: "summary_large_image", title: "Monytar Handbook", description },
}

export default function HandbookPage() {
  return <Handbook />
}
