import { describe, it, expect, vi } from "vitest"

// captureException logs even without a DSN; assert the type/value it derives.
describe("captureException error normalization", () => {
  it("names Supabase/Postgres error objects by their code instead of UnknownError", async () => {
    const { logger } = await import("@/lib/observability/logger")
    const spy = vi.spyOn(logger, "error").mockImplementation(() => {})
    const { captureException } = await import("@/lib/observability/capture")
    await captureException({ code: "23505", message: 'duplicate key value violates unique constraint "x"', details: "Key (a)=(1) already exists." })
    const [message, ctx] = spy.mock.calls[0] as [string, { errorType: string }]
    expect(ctx.errorType).toBe("DatabaseError 23505")
    expect(message).toContain("duplicate key value")
    spy.mockRestore()
  })
})
