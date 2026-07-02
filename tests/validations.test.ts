import { describe, it, expect } from "vitest"
import {
  loginSchema,
  signupSchema,
  expenseRequestSchema,
  vendorSchema,
  departmentSchema,
  userSchema,
  rejectSchema,
  paymentSchema,
} from "@/lib/validations"

describe("loginSchema", () => {
  it("accepts a valid login", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "secret1" }).success).toBe(true)
  })
  it("rejects a bad email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "secret1" }).success).toBe(false)
  })
  it("rejects a short password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "123" }).success).toBe(false)
  })
})

describe("signupSchema", () => {
  it("accepts a full valid signup", () => {
    const res = signupSchema.safeParse({
      fullName: "Ama Mensah",
      email: "ama@acme.com",
      password: "supersecret",
      orgName: "Acme Inc",
    })
    expect(res.success).toBe(true)
  })
  it("requires an 8+ char password (stronger than login)", () => {
    const res = signupSchema.safeParse({
      fullName: "Ama Mensah",
      email: "ama@acme.com",
      password: "short7!",
      orgName: "Acme Inc",
    })
    expect(res.success).toBe(false)
  })
  it("requires an organization name", () => {
    const res = signupSchema.safeParse({
      fullName: "Ama Mensah",
      email: "ama@acme.com",
      password: "supersecret",
      orgName: "",
    })
    expect(res.success).toBe(false)
  })
})

describe("expenseRequestSchema", () => {
  const base = {
    title: "Team lunch",
    description: "Quarterly team lunch with the whole squad",
    amount: 120.5,
    category: "meals" as const,
  }

  it("accepts a valid request and defaults priority to medium", () => {
    const res = expenseRequestSchema.safeParse(base)
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.priority).toBe("medium")
  })

  it("rejects non-positive amounts", () => {
    expect(expenseRequestSchema.safeParse({ ...base, amount: 0 }).success).toBe(false)
    expect(expenseRequestSchema.safeParse({ ...base, amount: -5 }).success).toBe(false)
  })

  it("rejects amounts over the 1,000,000 ceiling", () => {
    expect(expenseRequestSchema.safeParse({ ...base, amount: 1_000_001 }).success).toBe(false)
  })

  it("rejects an unknown category", () => {
    expect(expenseRequestSchema.safeParse({ ...base, category: "crypto" }).success).toBe(false)
  })

  it("rejects non-URL receipt entries", () => {
    expect(expenseRequestSchema.safeParse({ ...base, receipt_urls: ["not-a-url"] }).success).toBe(false)
    expect(
      expenseRequestSchema.safeParse({ ...base, receipt_urls: ["https://cdn.test/r.png"] }).success,
    ).toBe(true)
  })
})

describe("vendorSchema", () => {
  it("allows empty-string optional contact fields", () => {
    const res = vendorSchema.safeParse({ name: "Uber", contact_email: "", website: "" })
    expect(res.success).toBe(true)
  })
  it("rejects a malformed website when provided", () => {
    expect(vendorSchema.safeParse({ name: "Uber", website: "ht!tp" }).success).toBe(false)
  })
})

describe("departmentSchema", () => {
  it("rejects a negative budget", () => {
    expect(departmentSchema.safeParse({ name: "Ops", budget_amount: -1 }).success).toBe(false)
  })
  it("defaults budget_period to monthly", () => {
    const res = departmentSchema.safeParse({ name: "Ops", budget_amount: 0 })
    expect(res.success && res.data.budget_period).toBe("monthly")
  })
})

describe("userSchema", () => {
  it("defaults role to employee", () => {
    const res = userSchema.safeParse({ full_name: "Kojo B", email: "k@b.com" })
    expect(res.success && res.data.role).toBe("employee")
  })
  it("rejects an invalid role (privilege guard)", () => {
    expect(userSchema.safeParse({ full_name: "Kojo B", email: "k@b.com", role: "superuser" }).success).toBe(
      false,
    )
  })
})

describe("rejectSchema", () => {
  it("requires a reason of at least 5 chars", () => {
    expect(rejectSchema.safeParse({ comment: "no" }).success).toBe(false)
    expect(rejectSchema.safeParse({ comment: "Out of policy budget" }).success).toBe(true)
  })
})

describe("paymentSchema", () => {
  it("requires a reference and a known method", () => {
    expect(paymentSchema.safeParse({ payment_reference: "TX-1", payment_method: "bank_transfer" }).success).toBe(
      true,
    )
    expect(paymentSchema.safeParse({ payment_reference: "", payment_method: "bank_transfer" }).success).toBe(
      false,
    )
    expect(paymentSchema.safeParse({ payment_reference: "TX-1", payment_method: "bitcoin" }).success).toBe(false)
  })
})
