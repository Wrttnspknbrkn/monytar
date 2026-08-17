/**
 * Keyset (cursor) pagination helpers for lists ordered by `created_at DESC, id DESC`.
 *
 * Keyset pagination avoids the cost of `OFFSET` and `count: "exact"` on large
 * tables: each page is fetched with a `WHERE (created_at, id) < (cursor)` filter
 * that rides the composite index, so performance stays flat as the table grows.
 */

export interface Cursor {
  createdAt: string
  id: string
}

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

/** Clamps a requested page size into the allowed range. */
export function clampLimit(raw: unknown): number {
  const n = typeof raw === "string" ? parseInt(raw, 10) : typeof raw === "number" ? raw : NaN
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PAGE_SIZE
  return Math.min(Math.trunc(n), MAX_PAGE_SIZE)
}

/** Encodes a cursor to an opaque, URL-safe base64 token. */
export function encodeCursor(cursor: Cursor): string {
  const json = JSON.stringify([cursor.createdAt, cursor.id])
  const b64 = typeof btoa === "function" ? btoa(json) : Buffer.from(json, "utf8").toString("base64")
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** Decodes an opaque cursor token; returns null for missing/malformed input. */
export function decodeCursor(token: string | null | undefined): Cursor | null {
  if (!token) return null
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/")
    const json = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("utf8")
    const parsed = JSON.parse(json)
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === "string" &&
      typeof parsed[1] === "string"
    ) {
      return { createdAt: parsed[0], id: parsed[1] }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Given the rows returned for a page (fetched with limit+1 to detect more),
 * returns the trimmed page and the next cursor (null when there are no more).
 */
export function buildPage<T extends { created_at: string; id: string }>(
  rows: T[],
  limit: number,
): { items: T[]; nextCursor: string | null } {
  if (rows.length <= limit) {
    return { items: rows, nextCursor: null }
  }
  const items = rows.slice(0, limit)
  const last = items[items.length - 1]
  return { items, nextCursor: encodeCursor({ createdAt: last.created_at, id: last.id }) }
}
