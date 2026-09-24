import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

// Public marketing pages are open. The signed-in app and the API are not for search engines.
// Sign-in / checkout pages are left crawlable on purpose and marked noindex instead, so
// Google can actually see the noindex instruction.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/requests",
          "/approvals",
          "/vendors",
          "/departments",
          "/users",
          "/reports",
          "/settings",
          "/notifications",
          "/help",
          "/demo-leads",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
