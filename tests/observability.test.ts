import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { redact } from "@/lib/observability/logger"
import { captureException, isErrorTrackingEnabled } from "@/lib/observability/capture"
import { serverError, clientError } from "@/lib/api/errors"
import {
  clampLimit,
  encodeCursor,
  decodeCursor,
  buildPage,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "@/lib/api/pagination"

describe("logger.redact", () => {
  it("redacts sensitive keys case-insensitively", () => {
    const out = redact({
      email: "a@b.com",
      password: "hunter2",
      API_Key: "sk_live_123",
      nested: { authorization: "Bearer x", ok: 1 },
    }) as Record<string, unknown>

    expect(out.email).toBe("a@b.com")
    expect(out.password).toBe("[REDACTED]")
    expect(out.API_Key).toBe("[REDACTED]")
    expect((out.nested as Record<string, unknown>).authorization).toBe("[REDACTED]")
    expect((out.nested as Record<string, unknown>).ok).toBe(1)
  })

  it("redacts inside arrays and handles primitives", () => {
    const out = redact([{ token: "t" }, "plain", 5]) as unknown[]
    expect((out[0] as Record<string, unknown>).token).toBe("[REDACTED]")
    expect(out[1]).toBe("plain")
    expect(out[2]).toBe(5)
  })

  it("handles circular references without throwing", () => {
    const obj: Record<string, unknown> = { a: 1 }
    obj.self = obj
    const out = redact(obj) as Record<string, unknown>
    expect(out.a).toBe(1)
    expect(out.self).toBe("[Circular]")
  })
})

describe("captureException", () => {
  const originalDsn = process.env.SENTRY_DSN

  beforeEach(() => {
    delete process.env.SENTRY_DSN
    delete process.env.NEXT_PUBLIC_SENTRY_DSN
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})
  })

  afterEach(() => {
    if (originalDsn) process.env.SENTRY_DSN = originalDsn
    vi.restoreAllMocks()
  })

  it("no-ops the network path when no DSN is configured", async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal("fetch", fetchSpy)
    expect(isErrorTrackingEnabled()).toBe(false)

    await captureException(new Error("boom"), { route: "x" })

    expect(fetchSpy).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it("forwards to the parsed Sentry endpoint when a DSN is set", async () => {
    process.env.SENTRY_DSN = "https://pubkey@o1.ingest.sentry.io/42"
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", fetchSpy)

    expect(isErrorTrackingEnabled()).toBe(true)
    await captureException(new Error("boom"))

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe("https://o1.ingest.sentry.io/api/42/store/")
    expect((init.headers as Record<string, string>)["X-Sentry-Auth"]).toContain("sentry_key=pubkey")
    vi.unstubAllGlobals()
  })

  it("never throws even if forwarding fails", async () => {
    process.env.SENTRY_DSN = "https://pubkey@o1.ingest.sentry.io/42"
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")))
    await expect(captureException(new Error("boom"))).resolves.toBeUndefined()
    vi.unstubAllGlobals()
  })
})

describe("serverError / clientError", () => {
  beforeEach(() => {
    delete process.env.SENTRY_DSN
    vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it("returns a generic 500 body that never leaks internals", async () => {
    const res = serverError(new Error("relation \"users\" does not exist"), { route: "t" })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe("Something went wrong. Please try again.")
    expect(JSON.stringify(body)).not.toContain("relation")
  })

  it("supports a custom status", async () => {
    const res = serverError("x", {}, 503)
    expect(res.status).toBe(503)
  })

  it("clientError passes an explicit safe message through", async () => {
    const res = clientError("Invalid email or password", 401)
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe("Invalid email or password")
  })
})

describe("pagination", () => {
  it("clamps limits into range with a sane default", () => {
    expect(clampLimit("10")).toBe(10)
    expect(clampLimit("0")).toBe(DEFAULT_PAGE_SIZE)
    expect(clampLimit("-5")).toBe(DEFAULT_PAGE_SIZE)
    expect(clampLimit("abc")).toBe(DEFAULT_PAGE_SIZE)
    expect(clampLimit(undefined)).toBe(DEFAULT_PAGE_SIZE)
    expect(clampLimit("99999")).toBe(MAX_PAGE_SIZE)
    expect(clampLimit("25.7")).toBe(25)
  })

  it("round-trips a cursor through encode/decode", () => {
    const cursor = { createdAt: "2026-01-01T00:00:00.000Z", id: "abc-123" }
    const token = encodeCursor(cursor)
    expect(token).not.toContain("+")
    expect(token).not.toContain("/")
    expect(token).not.toContain("=")
    expect(decodeCursor(token)).toEqual(cursor)
  })

  it("returns null for missing or malformed cursors", () => {
    expect(decodeCursor(null)).toBeNull()
    expect(decodeCursor("")).toBeNull()
    expect(decodeCursor("not-base64-json!!")).toBeNull()
  })

  it("builds a page and next cursor when more rows exist", () => {
    const rows = [
      { id: "1", created_at: "2026-01-03T00:00:00Z" },
      { id: "2", created_at: "2026-01-02T00:00:00Z" },
      { id: "3", created_at: "2026-01-01T00:00:00Z" }, // sentinel (limit+1)
    ]
    const { items, nextCursor } = buildPage(rows, 2)
    expect(items).toHaveLength(2)
    expect(nextCursor).not.toBeNull()
    expect(decodeCursor(nextCursor)).toEqual({ createdAt: "2026-01-02T00:00:00Z", id: "2" })
  })

  it("returns a null cursor on the last page", () => {
    const rows = [{ id: "1", created_at: "2026-01-03T00:00:00Z" }]
    const { items, nextCursor } = buildPage(rows, 2)
    expect(items).toHaveLength(1)
    expect(nextCursor).toBeNull()
  })
})
