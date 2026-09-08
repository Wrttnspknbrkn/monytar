import { describe, it, expect } from "vitest"
import {
  PRODUCTS,
  getProductById,
  getProductByTier,
  getTierLimits,
  getTierFromProductId,
  getTierFromPriceAmount,
  resolveSubscriptionTier,
  type SubscriptionTier,
} from "@/lib/products"

const VALID_TIERS: SubscriptionTier[] = ["free", "starter", "professional", "enterprise"]

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
      maxUsers: 3,
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
      maxUsers: 3,
      maxDepartments: 1,
      maxRequestsPerMonth: 50,
    })
  })
})

describe("subscription tier resolution (Stripe webhook)", () => {
  it("resolves tier from a known product id", () => {
    for (const product of PRODUCTS) {
      expect(getTierFromProductId(product.id)).toBe(product.tier)
    }
  })

  it("returns null for unknown or missing product ids", () => {
    expect(getTierFromProductId("does-not-exist")).toBeNull()
    expect(getTierFromProductId(null)).toBeNull()
    expect(getTierFromProductId(undefined)).toBeNull()
  })

  it("never returns an invalid tier from a price amount (regression: no 'business')", () => {
    for (const amount of [0, 1, 1900, 4900, 9900, 19900, 49000, 999999]) {
      const tier = getTierFromPriceAmount(amount)
      expect(VALID_TIERS).toContain(tier)
      expect(tier).not.toBe("business")
    }
  })

  it("maps zero/negative amounts to free", () => {
    expect(getTierFromPriceAmount(0)).toBe("free")
    expect(getTierFromPriceAmount(-100)).toBe("free")
  })

  it("prefers product_id metadata over price amount", () => {
    const pro = PRODUCTS.find((p) => p.tier === "professional")!
    // Even with a mismatched price, the authoritative product id wins.
    expect(resolveSubscriptionTier({ productId: pro.id, priceAmount: 1 })).toBe("professional")
  })

  it("falls back to price amount when product id is absent", () => {
    const tier = resolveSubscriptionTier({ priceAmount: 1900 })
    expect(VALID_TIERS).toContain(tier)
  })

  it("always yields a DB-valid tier for any input", () => {
    expect(VALID_TIERS).toContain(resolveSubscriptionTier({}))
    expect(VALID_TIERS).toContain(resolveSubscriptionTier({ productId: "bogus", priceAmount: 123456 }))
  })
})
