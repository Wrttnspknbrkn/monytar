import type { MetadataRoute } from "next"
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} - ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#fcfcfd",
    theme_color: "#2563eb",
    icons: [{ src: "/apple-icon", sizes: "180x180", type: "image/png" }],
  }
}
