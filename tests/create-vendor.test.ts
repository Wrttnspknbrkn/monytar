import { beforeEach, describe, expect, it, vi } from "vitest"
import { createVendor } from "@/lib/hooks/use-supabase-data"

/**
 * Adding a vendor with a note used to fail for everyone, because the database had no `notes` column
 * (supabase/migrations/025). createVendor now adds the vendor without the note when that column is missing,
 * and says so, instead of refusing the whole thing.
 */

type Insert = { payload: Record<string, unknown>; result: { data: unknown; error: unknown } }
let calls: Record<string, unknown>[] = []
let script: Insert["result"][] = []

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({
      insert: (payload: Record<string, unknown>) => {
        calls.push(payload)
        const result = script.shift() ?? { data: null, error: { code: "TEST", message: "no scripted result" } }
        return { select: () => ({ single: async () => result }) }
      },
    }),
  }),
}))

const missingNotes = { code: "PGRST204", message: "Could not find the 'notes' column of 'vendors' in the schema cache" }
const row = { id: "v1", name: "Acme", organization_id: "org" }

beforeEach(() => {
  calls = []
  script = []
})

describe("createVendor", () => {
  it("saves the vendor with its note when the database supports notes", async () => {
    script = [{ data: { ...row, notes: "Preferred" }, error: null }]
    const v = await createVendor({ name: "Acme", notes: "Preferred" })
    expect(calls).toHaveLength(1)
    expect(v.notes).toBe("Preferred")
    expect(v.notes_not_saved).toBeUndefined()
  })

  it("when the notes column is missing, adds the vendor without the note and reports that", async () => {
    script = [
      { data: null, error: missingNotes },
      { data: row, error: null },
    ]
    const v = await createVendor({ name: "Acme", notes: "Preferred" })
    expect(calls).toHaveLength(2)
    expect(calls[0]).toHaveProperty("notes", "Preferred")
    expect(calls[1]).not.toHaveProperty("notes")
    expect(calls[1]).toHaveProperty("name", "Acme")
    expect(v.notes_not_saved).toBe(true)
    expect(v.id).toBe("v1")
  })

  it("does not retry when there was no note to drop", async () => {
    script = [{ data: null, error: missingNotes }]
    await expect(createVendor({ name: "Acme" })).rejects.toMatchObject({ code: "PGRST204" })
    expect(calls).toHaveLength(1)
  })

  it("does not hide a missing column that is not notes", async () => {
    script = [{ data: null, error: { code: "PGRST204", message: "Could not find the 'category' column of 'vendors' in the schema cache" } }]
    await expect(createVendor({ name: "Acme", notes: "x" })).rejects.toMatchObject({ code: "PGRST204" })
    expect(calls).toHaveLength(1)
  })

  it("passes any other error straight through", async () => {
    script = [{ data: null, error: { code: "42501", message: "permission denied" } }]
    await expect(createVendor({ name: "Acme", notes: "x" })).rejects.toMatchObject({ code: "42501" })
    expect(calls).toHaveLength(1)
  })

  it("if the retry also fails, that error is raised", async () => {
    script = [
      { data: null, error: missingNotes },
      { data: null, error: { code: "42501", message: "permission denied" } },
    ]
    await expect(createVendor({ name: "Acme", notes: "x" })).rejects.toMatchObject({ code: "42501" })
  })
})
