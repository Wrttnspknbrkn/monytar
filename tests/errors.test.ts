import { describe, expect, it } from "vitest"
import { getErrorMessage, isMissingColumnError } from "@/lib/errors"

// Supabase/PostgREST errors are plain objects, not Error instances. The Add vendor form used to throw
// that detail away and show "Couldn't add the vendor" for every failure.
const postgrest = (code: string, message: string) => ({ code, message, details: null, hint: null })

describe("getErrorMessage", () => {
  const fallback = "Couldn't add the vendor. Please try again."

  it("reads the message from an Error", () => {
    expect(getErrorMessage(new Error("A vendor with this name already exists."), fallback)).toBe("A vendor with this name already exists.")
  })

  it("explains a missing database column in plain words instead of the generic message", () => {
    const err = postgrest("PGRST204", "Could not find the 'notes' column of 'vendors' in the schema cache")
    expect(getErrorMessage(err, fallback)).toMatch(/administrator/i)
    expect(getErrorMessage(err, fallback)).not.toContain("schema cache")
  })

  it("explains permission, duplicate and bad-value errors", () => {
    expect(getErrorMessage(postgrest("42501", "permission denied for table vendors"), fallback)).toMatch(/permission/i)
    expect(getErrorMessage(postgrest("23505", "duplicate key value violates unique constraint"), fallback)).toMatch(/already exists/i)
    expect(getErrorMessage(postgrest("22P02", "invalid input syntax for type uuid"), fallback)).toMatch(/format/i)
    expect(getErrorMessage({ message: 'new row violates row-level security policy for table "vendors"' }, fallback)).toMatch(/permission/i)
  })

  it("explains a dropped connection", () => {
    expect(getErrorMessage(new TypeError("Failed to fetch"), fallback)).toMatch(/connection/i)
  })

  it("never shows raw SQL or stack text, and falls back when there is nothing useful", () => {
    expect(getErrorMessage({ message: 'insert into "vendors" (name) values ($1) failed' }, fallback)).toBe(fallback)
    expect(getErrorMessage({ message: "x".repeat(400) }, fallback)).toBe(fallback)
    expect(getErrorMessage(undefined, fallback)).toBe(fallback)
    expect(getErrorMessage("boom", fallback)).toBe(fallback)
  })
})

describe("isMissingColumnError", () => {
  const notes = postgrest("PGRST204", "Could not find the 'notes' column of 'vendors' in the schema cache")

  it("recognises a missing column, optionally a specific one", () => {
    expect(isMissingColumnError(notes)).toBe(true)
    expect(isMissingColumnError(notes, "notes")).toBe(true)
    expect(isMissingColumnError(notes, "category")).toBe(false)
    expect(isMissingColumnError(postgrest("42703", 'column "notes" does not exist'), "notes")).toBe(true)
  })

  it("does not mistake other errors for it", () => {
    expect(isMissingColumnError(postgrest("23505", "duplicate key"))).toBe(false)
    expect(isMissingColumnError(new Error("boom"))).toBe(false)
    expect(isMissingColumnError(null)).toBe(false)
  })
})
