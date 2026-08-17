import { NextResponse } from "next/server"
import { captureException } from "@/lib/observability/capture"
import type { LogContext } from "@/lib/observability/logger"

/**
 * Handles an unexpected server/database error: captures the full detail to the
 * observability sink and returns a generic response so raw internals (Postgres
 * messages, stack traces) never leak to clients.
 *
 * `context` should identify the route/operation (e.g. { route: "requests.POST" })
 * plus any non-sensitive identifiers useful for debugging.
 */
export function serverError(
  err: unknown,
  context?: LogContext,
  status = 500,
): NextResponse {
  // Fire-and-forget: capture must not block or throw in the request path.
  void captureException(err, context)
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status })
}

/** Returns a client-facing error with a safe, explicit message (no internals). */
export function clientError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}
