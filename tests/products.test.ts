import { describe, it, expect } from "vitest"
import {
  PRODUCTS,
  getProductById,
  getProductByTier,
  getTierLimits,
  type SubscriptionTier,
} from "@/lib/products"

describe("PRODUCTS catalog integrity", () => {
  it("has unique product ids", () => {
    const ids = PRODUCTS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("covers every subscription tier", () => {
    const tiers = new Set(PRODUCTS.map((p) => p.tier))
    expect(tiers).toEqual(new Set<SubscriptionTier>(["free", "starter", "professional", "enterprise"]))
  })

  it("has non-negative integer prices in cents", () => {
    for (const p of PRODUCTS) {
      expect(p.priceInCents).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(p.priceInCents)).toBe(true)
    }
  })

  it("gives yearly plans a genuine discount over 12x monthly", () => {
    for (const tier of ["starter", "professional"] as const) {
      const monthly = PRODUCTS.find((p) => p.tier === tier && p.interval === "month")!
      const yearly = PRODUCTS.find((p) => p.tier === tier && p.interval === "year")!
      expect(yearly.priceInCents).toBeLessThan(monthly.priceInCents * 12)
      // "2 months free" => yearly equals 10x monthly
      expect(yearly.priceInCents).toBe(monthly.priceInCents * 10)
    }
  })

  it("marks exactly the professional plans as popular", () => {
    const popular = PRODUCTS.filter((p) => p.popular)
    expect(popular.length).toBeGreaterThan(0)
    expect(popular.every((p) => p.tier === "professional")).toBe(true)
  })
})

describe("getProductById", () => {
  it("returns the matching product", () => {
    expect(getProductById("professional-monthly")?.tier).toBe("professional")
  })

  it("returns undefined for an unknown id (tamper protection)", () => {
    expect(getProductById("free-monthly-9999")).toBeUndefined()
    expect(getProductById("")).toBeUndefined()
  })
})

describe("getProductByTier", () => {
  it("returns the single free product regardless of interval", () => {
    expect(getProductByTier("free")?.id).toBe("free")
    expect(getProductByTier("free", "year")?.id).toBe("free")
  })

  it("returns interval-specific products for paid tiers", () => {
    expect(getProductByTier("starter", "month")?.id).toBe("starter-monthly")
    expect(getProductByTier("starter", "year")?.id).toBe("starter-yearly")
  })

  it("defaults to monthly interval", () => {
    expect(getProductByTier("professional")?.interval).toBe("month")
  })

  it("maps enterprise to the monthly custom product", () => {
    expect(getProductByTier("enterprise")?.id).toBe("enterprise-monthly")
  })
})

describe("getTierLimits", () => {
  it("returns the free tier limits", () => {
    expect(getTierLimits("free")).toEqual({
      maxUsers: 5,
      maxDepartments: 1,
      maxRequestsPerMonth: 50,
    })
  })

  it("returns unlimited (-1 / null) for enterprise", () => {
    const limits = getTierLimits("enterprise")
    expect(limits.maxUsers).toBe(-1)
    expect(limits.maxDepartments).toBe(-1)
    expect(limits.maxRequestsPerMonth).toBeNull()
  })

  it("falls back to free limits for an invalid tier", () => {
    expect(getTierLimits("nonsense" as SubscriptionTier)).toEqual({
      maxUsers: 5,
      maxDepartments: 1,
      maxRequestsPerMonth: 50,
    })
  })
})
