import type { Metadata } from "next"
import LandingPage from "@/components/landing/home-page"
import { JsonLd } from "@/components/json-ld"
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, absoluteUrl } from "@/lib/seo"

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} - ${SITE_TAGLINE}` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: `${SITE_NAME} - ${SITE_TAGLINE}`, description: SITE_DESCRIPTION, url: "/", siteName: SITE_NAME, type: "website", locale: "en_US" },
}

// Only facts already shown on the public site.
const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/images/monytar-blue.png"),
    email: "hello@monytar.com",
    address: { "@type": "PostalAddress", addressLocality: "Accra", addressCountry: "GH" },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    publisher: { "@id": absoluteUrl("/#organization") },
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free plan available" },
  },
]

export default function HomePage() {
  return (
    <>
      <JsonLd data={structuredData} />
      <LandingPage />
    </>
  )
}
