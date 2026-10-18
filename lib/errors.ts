/**
 * Turns anything a save can throw into a sentence a person can act on.
 *
 * Supabase/PostgREST errors are plain objects, NOT `Error` instances, so the common
 * `err instanceof Error ? err.message : "Couldn't ..."` pattern threw the real reason
 * away and every failure looked the same. This reads the message from either shape and
 * translates the database codes people actually run into.
 */

type DbErrorLike = { code?: string; message?: string; details?: string; hint?: string }

function asDbError(err: unknown): DbErrorLike | null {
  if (err && typeof err === "object") return err as DbErrorLike
  return null
}

/** True when the database has no such column: the app is ahead of the database. */
export function isMissingColumnError(err: unknown, column?: string): boolean {
  const e = asDbError(err)
  if (!e) return false
  const missing = e.code === "PGRST204" || e.code === "42703" || /could not find the '.*' column|column .* does not exist/i.test(e.message ?? "")
  if (!missing) return false
  return column ? new RegExp(`['"\\s.]${column}['"\\s]`, "i").test(e.message ?? "") : true
}

export function getErrorMessage(err: unknown, fallback: string): string {
  const e = asDbError(err)
  const message = err instanceof Error ? err.message : e?.message

  switch (e?.code) {
    case "42501":
      return "You don't have permission to do that."
    case "23505":
      return "That already exists."
    case "23503":
      return "That is linked to something that no longer exists."
    case "23514":
      return "One of the values isn't allowed. Check the form and try again."
    case "22P02":
      return "One of the values isn't in the right format."
    case "PGRST204":
    case "42703":
      return "Part of this form isn't supported by your database yet. Ask your administrator to apply the latest update."
    case "PGRST301":
    case "401":
      return "Your session has ended. Sign in again and retry."
  }
  if (/row-level security/i.test(message ?? "")) return "You don't have permission to do that."
  if (/failed to fetch|networkerror|load failed/i.test(message ?? "")) return "Couldn't reach the server. Check your connection and try again."
  // Never show raw SQL/stack text; a short plain message from our own code is fine to show.
  if (message && message.length <= 160 && !/select |insert |update |delete |violates|syntax/i.test(message)) return message
  return fallback
}
