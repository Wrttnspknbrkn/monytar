import { describe, it, expect, beforeAll } from "vitest"

/**
 * API route integration tests.
 *
 * These import the App Router route handlers directly and invoke them with
 * standard `Request` objects. We force demo mode (no Supabase env) so the
 * handlers exercise their validation + demo branches without a live database.
 * This verifies input validation, error handling, and the consistent
 * response contract every route promises.
 */

// Force demo mode before any route module reads process.env.
beforeAll(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
})

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

function rawRequest(url: string, body: string): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  })
}

describe("POST /api/requests", () => {
  it("rejects invalid payloads with 400 and field details", async () => {
    const { POST } = await import("@/app/api/requests/route")
    const res = await POST(jsonRequest("http://test/api/requests", { title: "no" }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe("Invalid input")
    expect(json.details).toBeTruthy()
  })

  it("rejects negative amounts", async () => {
    const { POST } = await import("@/app/api/requests/route")
    const res = await POST(
      jsonRequest("http://test/api/requests", {
        title: "Team lunch",
        description: "Quarterly team lunch meeting",
        amount: -50,
        category: "meals",
      }),
    )
    expect(res.status).toBe(400)
  })

  it("accepts a valid payload in demo mode", async () => {
    const { POST } = await import("@/app/api/requests/route")
    const res = await POST(
      jsonRequest("http://test/api/requests", {
        title: "New laptop",
        description: "Replacement laptop for engineering",
        amount: 1800,
        category: "equipment",
        priority: "high",
      }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({ demo: true, success: true })
  })
})

describe("GET /api/requests", () => {
  it("returns a demo response when Supabase is not configured", async () => {
    const { GET } = await import("@/app/api/requests/route")
    const res = await GET(new Request("http://test/api/requests"))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.demo).toBe(true)
  })
})

describe("POST /api/vendors", () => {
  it("rejects a vendor without a name", async () => {
    const { POST } = await import("@/app/api/vendors/route")
    const res = await POST(jsonRequest("http://test/api/vendors", { name: "" }))
    expect(res.status).toBe(400)
  })

  it("accepts a valid vendor in demo mode", async () => {
    const { POST } = await import("@/app/api/vendors/route")
    const res = await POST(
      jsonRequest("http://test/api/vendors", {
        name: "Acme Supplies",
        contact_email: "billing@acme.com",
      }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({ demo: true, success: true })
  })

  it("rejects a malformed vendor email", async () => {
    const { POST } = await import("@/app/api/vendors/route")
    const res = await POST(
      jsonRequest("http://test/api/vendors", { name: "Acme", contact_email: "not-an-email" }),
    )
    expect(res.status).toBe(400)
  })
})

describe("POST /api/auth/signup", () => {
  it("rejects a weak password", async () => {
    const { POST } = await import("@/app/api/auth/signup/route")
    const res = await POST(
      jsonRequest("http://test/api/auth/signup", {
        fullName: "Ama Mensah",
        email: "ama@acme.com",
        password: "short",
        orgName: "Acme Inc",
      }),
    )
    expect(res.status).toBe(400)
  })

  it("accepts a valid signup in demo mode", async () => {
    const { POST } = await import("@/app/api/auth/signup/route")
    const res = await POST(
      jsonRequest("http://test/api/auth/signup", {
        fullName: "Ama Mensah",
        email: "ama@acme.com",
        password: "supersecret1",
        orgName: "Acme Inc",
      }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({ success: true, demo: true, email: "ama@acme.com" })
  })
})

describe("POST /api/requests/[id]/approve", () => {
  it("approves in demo mode with an optional comment", async () => {
    const { POST } = await import("@/app/api/requests/[id]/approve/route")
    const res = await POST(jsonRequest("http://test/api/requests/req-1/approve", { comment: "Looks good" }), {
      params: Promise.resolve({ id: "req-1" }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({ demo: true, success: true })
  })
})

describe("POST /api/demo-leads", () => {
  it("rejects invalid JSON with 400", async () => {
    const { POST } = await import("@/app/api/demo-leads/route")
    const res = await POST(rawRequest("http://test/api/demo-leads", "{not json"))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe("Invalid JSON")
  })

  it("rejects a lead without a valid email", async () => {
    const { POST } = await import("@/app/api/demo-leads/route")
    const res = await POST(jsonRequest("http://test/api/demo-leads", { full_name: "Kofi", email: "nope" }))
    expect(res.status).toBe(400)
  })

  it("accepts a valid lead in demo mode", async () => {
    const { POST } = await import("@/app/api/demo-leads/route")
    const res = await POST(
      jsonRequest("http://test/api/demo-leads", {
        full_name: "Kofi Adjei",
        email: "kofi@acme.com",
        entry_role: "finance",
      }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({ success: true, demo: true })
  })

  it("returns an empty lead list in demo mode", async () => {
    const { GET } = await import("@/app/api/demo-leads/route")
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.leads).toEqual([])
  })
})
