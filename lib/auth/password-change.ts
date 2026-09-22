// Password-change protocol against Supabase Auth, kept free of React/UI so every branch
// can be unit-tested. Supabase always requires `current_password`, and additionally an
// emailed one-time code (`nonce`) when the session is old enough to need reauthentication.

interface AuthError {
  code?: string
  message?: string
}

export interface PasswordAuthClient {
  auth: {
    updateUser(attributes: { password: string; current_password?: string; nonce?: string }): Promise<{ error: AuthError | null }>
    reauthenticate(): Promise<{ error: AuthError | null }>
  }
}

export type PasswordChangeResult =
  | { status: "changed" }
  | { status: "needs_code" }
  | { status: "error"; message: string }

export function passwordErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "same_password":
      return "Your new password must be different from your current one."
    case "weak_password":
      return "That password is too weak. Use a longer password with a mix of letters, numbers and symbols."
    case "reauthentication_not_valid":
      return "That confirmation code is incorrect or has expired. Request a new one."
    case "current_password_mismatch":
      return "Your current password is incorrect."
    default:
      return error.message || "Couldn't update your password. Please try again."
  }
}

/** Step 1: try the change directly; only request an emailed code if the server demands one. */
export async function requestPasswordChange(
  client: PasswordAuthClient,
  input: { currentPassword: string; newPassword: string },
): Promise<PasswordChangeResult> {
  const { error } = await client.auth.updateUser({ password: input.newPassword, current_password: input.currentPassword })
  if (!error) return { status: "changed" }
  if (error.code !== "reauthentication_needed") return { status: "error", message: passwordErrorMessage(error) }

  const { error: reauthError } = await client.auth.reauthenticate()
  if (reauthError) return { status: "error", message: "We couldn't send the confirmation code. Please try again in a minute." }
  return { status: "needs_code" }
}

/** Step 2 (only after "needs_code"): submit the emailed code together with the new password. */
export async function confirmPasswordChange(
  client: PasswordAuthClient,
  input: { currentPassword: string; newPassword: string; code: string },
): Promise<PasswordChangeResult> {
  const { error } = await client.auth.updateUser({
    password: input.newPassword,
    current_password: input.currentPassword,
    nonce: input.code.trim(),
  })
  return error ? { status: "error", message: passwordErrorMessage(error) } : { status: "changed" }
}
