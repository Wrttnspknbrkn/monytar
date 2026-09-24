import type { Metadata } from "next"

/**
 * One place for everything search engines and link previews read.
 * The public site lives on the www host (the bare domain redirects to it), so that is
 * the canonical origin. NEXT_PUBLIC_APP_URL may override it (e.g. for staging), but a
 * localhost value or the bare domain is never used for canonical URLs.
 */
function resolveSiteUrl(): string {
  const fallback = "https://www.monytar.com"
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!raw) return fallback
  try {
    const u = new URL(raw)
    if (u.protocol !== "https:" || u.hostname === "localhost") return fallback
    if (u.hostname === "monytar.com") u.hostname = "www.monytar.com"
    return u.origin
  } catch {
    return fallback
  }
}

export const SITE_URL = resolveSiteUrl()
export const SITE_NAME = "Monytar"
export const SITE_TAGLINE = "Modern Expense Management Platform"
export const SITE_DESCRIPTION =
  "Monytar is the modern way to manage business expenses. Streamline requests, automate approvals, track budgets, and gain real-time financial insights for your organization."

/** The share picture (app/opengraph-image.tsx). Pages that set their own openGraph must name it, or link previews have no image. */
const SHARE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} - ${SITE_TAGLINE}` }

/** Absolute URL for a site path. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString()
}

interface PageSeo {
  /** Short page name. The site name is appended by the root title template. */
  title: string
  description: string
  /** Path of this page, e.g. "/pricing". Becomes the canonical URL. */
  path: string
  /** Keep out of search results (sign-in, checkout, etc.). */
  noindex?: boolean
}

/** Metadata for a public page: title, description, canonical, link previews. */
export function pageMetadata({ title, description, path, noindex }: PageSeo): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url: path, siteName: SITE_NAME, type: "website", locale: "en_US", images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title: `${title} | ${SITE_NAME}`, description, images: [SHARE_IMAGE.url] },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  }
}

/** For pages that should never appear in search: sign-in, sign-up, checkout, password reset. */
export function noindexMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: false } }
}
