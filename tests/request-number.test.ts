import { describe, it, expect, vi } from "vitest"
import { insertWithUniqueRequestNumber, isRequestNumberCollision } from "@/lib/requests/request-number"

const collision = {
  code: "23505",
  message: 'duplicate key value violates unique constraint "expense_requests_request_number_key"',
  details: "Key (request_number)=(REQ-2026-00004) already exists.",
}

describe("isRequestNumberCollision", () => {
  it("recognises the request_number unique violation", () => {
    expect(isRequestNumberCollision(collision)).toBe(true)
  })
  it("ignores other unique violations and other errors", () => {
    expect(isRequestNumberCollision({ code: "23505", message: 'violates unique constraint "users_email_key"' })).toBe(false)
    expect(isRequestNumberCollision({ code: "42501", message: "permission denied for table expense_requests" })).toBe(false)
    expect(isRequestNumberCollision(null)).toBe(false)
  })
})

describe("insertWithUniqueRequestNumber", () => {
  it("inserts once when the first number is free", async () => {
    const allocate = vi.fn().mockResolvedValueOnce("REQ-2026-00001")
    const insert = vi.fn().mockResolvedValue({ data: { id: "a" }, error: null })
    const r = await insertWithUniqueRequestNumber(allocate, insert)
    expect(r).toEqual({ data: { id: "a" }, error: null, attempts: 1 })
    expect(allocate).toHaveBeenCalledTimes(1)
  })

  it("retries with a NEW number after a collision and succeeds", async () => {
    const allocate = vi.fn().mockResolvedValueOnce("REQ-2026-00004").mockResolvedValueOnce("REQ-2026-00005")
    const insert = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: collision })
      .mockResolvedValueOnce({ data: { id: "b" }, error: null })
    const r = await insertWithUniqueRequestNumber(allocate, insert)
    expect(r.error).toBeNull()
    expect(r.attempts).toBe(2)
    expect(insert).toHaveBeenNthCalledWith(1, "REQ-2026-00004")
    expect(insert).toHaveBeenNthCalledWith(2, "REQ-2026-00005")
  })

  it("does not retry unrelated errors", async () => {
    const allocate = vi.fn().mockResolvedValue("REQ-2026-00001")
    const rls = { code: "42501", message: "new row violates row-level security policy" }
    const insert = vi.fn().mockResolvedValue({ data: null, error: rls })
    const r = await insertWithUniqueRequestNumber(allocate, insert)
    expect(r.error).toBe(rls)
    expect(r.attempts).toBe(1)
    expect(insert).toHaveBeenCalledTimes(1)
  })

  it("gives up after maxAttempts and returns the last collision", async () => {
    const allocate = vi.fn().mockResolvedValue("REQ-2026-00009")
    const insert = vi.fn().mockResolvedValue({ data: null, error: collision })
    const r = await insertWithUniqueRequestNumber(allocate, insert, 3)
    expect(r.error).toBe(collision)
    expect(r.attempts).toBe(3)
    expect(insert).toHaveBeenCalledTimes(3)
  })
})
