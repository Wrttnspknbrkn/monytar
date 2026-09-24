import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

async function seo(appUrl?: string) {
  vi.resetModules()
  if (appUrl === undefined) vi.stubEnv("NEXT_PUBLIC_APP_URL", "")
  else vi.stubEnv("NEXT_PUBLIC_APP_URL", appUrl)
  return import("@/lib/seo")
}

describe("canonical site URL", () => {
  it("defaults to the www host", async () => {
    expect((await seo()).SITE_URL).toBe("https://www.monytar.com")
  })
  it("never uses localhost or a non-https origin", async () => {
    expect((await seo("http://localhost:3000")).SITE_URL).toBe("https://www.monytar.com")
    expect((await seo("http://example.com")).SITE_URL).toBe("https://www.monytar.com")
  })
  it("sends the bare domain to www, because the bare domain redirects there", async () => {
    expect((await seo("https://monytar.com")).SITE_URL).toBe("https://www.monytar.com")
  })
})

describe("sitemap and robots", () => {
  it("lists public pages and blog posts, and nothing private", async () => {
    const { default: sitemap } = await import("@/app/sitemap")
    const urls = sitemap().map((e) => e.url)
    expect(urls).toContain("https://www.monytar.com/")
    expect(urls).toContain("https://www.monytar.com/pricing")
    expect(urls.some((u) => u.includes("/blog/"))).toBe(true)
    for (const hidden of ["/login", "/signup", "/checkout", "/dashboard", "/requests", "/handbook", "/api"]) {
      expect(urls.some((u) => new URL(u).pathname.startsWith(hidden))).toBe(false)
    }
    expect(new Set(urls).size).toBe(urls.length)
  })
  it("points robots.txt at the sitemap and blocks the signed-in app", async () => {
    const { default: robots } = await import("@/app/robots")
    const r = robots()
    expect(r.sitemap).toBe("https://www.monytar.com/sitemap.xml")
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules
    expect(rule.disallow).toEqual(expect.arrayContaining(["/api/", "/dashboard", "/requests"]))
  })
})
