import { describe, it, expect, vi } from "vitest"
import { requestPasswordChange, confirmPasswordChange, passwordErrorMessage, type PasswordAuthClient } from "@/lib/auth/password-change"

function client(updateResults: Array<{ code?: string; message?: string } | null>, reauthError: { message: string } | null = null) {
  const updateUser = vi.fn()
  updateResults.forEach((e) => updateUser.mockResolvedValueOnce({ error: e }))
  const reauthenticate = vi.fn().mockResolvedValue({ error: reauthError })
  return { auth: { updateUser, reauthenticate } } satisfies PasswordAuthClient
}
const input = { currentPassword: "old-pass-1", newPassword: "new-pass-2" }

describe("requestPasswordChange", () => {
  it("changes the password directly, sending current_password and no emailed code", async () => {
    const c = client([null])
    expect(await requestPasswordChange(c, input)).toEqual({ status: "changed" })
    expect(c.auth.updateUser).toHaveBeenCalledWith({ password: "new-pass-2", current_password: "old-pass-1" })
    expect(c.auth.reauthenticate).not.toHaveBeenCalled()
  })

  it("falls back to the emailed code only when the server asks for reauthentication", async () => {
    const c = client([{ code: "reauthentication_needed" }])
    expect(await requestPasswordChange(c, input)).toEqual({ status: "needs_code" })
    expect(c.auth.reauthenticate).toHaveBeenCalledTimes(1)
  })

  it("reports a failed code email instead of pretending one was sent", async () => {
    const c = client([{ code: "reauthentication_needed" }], { message: "rate limited" })
    const r = await requestPasswordChange(c, input)
    expect(r.status).toBe("error")
    expect(c.auth.reauthenticate).toHaveBeenCalled()
  })

  it("maps server errors to readable messages without sending a code", async () => {
    const c = client([{ code: "same_password" }])
    expect(await requestPasswordChange(c, input)).toEqual({ status: "error", message: passwordErrorMessage({ code: "same_password" }) })
    expect(c.auth.reauthenticate).not.toHaveBeenCalled()
  })
})

describe("confirmPasswordChange", () => {
  it("submits the trimmed code as nonce together with current_password", async () => {
    const c = client([null])
    expect(await confirmPasswordChange(c, { ...input, code: " 12345678 " })).toEqual({ status: "changed" })
    expect(c.auth.updateUser).toHaveBeenCalledWith({ password: "new-pass-2", current_password: "old-pass-1", nonce: "12345678" })
  })

  it("explains a wrong or expired code", async () => {
    const c = client([{ code: "reauthentication_not_valid" }])
    const r = await confirmPasswordChange(c, { ...input, code: "00000000" })
    expect(r).toMatchObject({ status: "error" })
    expect((r as { message: string }).message).toMatch(/incorrect or has expired/)
  })
})
