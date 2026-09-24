// Request numbers are handed out per organization (REQ-2026-00001 restarts in
// every org), but the original schema made `request_number` UNIQUE across the
// WHOLE table. Two organizations therefore eventually receive the same number
// and the second insert fails with Postgres 23505
// ("expense_requests_request_number_key"). Migration 024 makes the constraint
// per-organization; this helper makes the app tolerate the old constraint too,
// so a collision costs one retry instead of a failed submission.

export interface PgLikeError {
  code?: string | null
  message?: string | null
  details?: string | null
}

/** True when an insert failed because the chosen request number is already taken. */
export function isRequestNumberCollision(error: PgLikeError | null | undefined): boolean {
  if (!error || error.code !== "23505") return false
  const haystack = `${error.message ?? ""} ${error.details ?? ""}`
  return haystack.includes("request_number")
}

export interface NumberedInsertResult<T> {
  data: T | null
  error: PgLikeError | null
  /** How many numbers were tried (1 = no collision). */
  attempts: number
}

/**
 * Allocates a request number and runs `insert` with it. On a request-number
 * collision it allocates a NEW number (the counter has already moved past the
 * clashing one) and tries again, up to `maxAttempts`. Any other error — or
 * running out of attempts — is returned as-is for the caller to report.
 */
export async function insertWithUniqueRequestNumber<T>(
  allocate: () => Promise<string>,
  insert: (requestNumber: string) => PromiseLike<{ data: T | null; error: PgLikeError | null }>,
  maxAttempts = 6,
): Promise<NumberedInsertResult<T>> {
  let last: { data: T | null; error: PgLikeError | null } = { data: null, error: null }
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const requestNumber = await allocate()
    last = await insert(requestNumber)
    if (!last.error || !isRequestNumberCollision(last.error)) {
      return { ...last, attempts: attempt }
    }
  }
  return { ...last, attempts: maxAttempts }
}
