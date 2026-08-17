import { logger, type LogContext } from "@/lib/observability/logger"

/**
 * Parses a Sentry DSN into the ingest URL + auth key needed to POST an event.
 * DSN shape: https://<publicKey>@<host>/<projectId>
 */
function parseDsn(dsn: string): { endpoint: string; publicKey: string } | null {
  try {
    const url = new URL(dsn)
    const publicKey = url.username
    const projectId = url.pathname.replace(/^\/+/, "")
    if (!publicKey || !projectId) return null
    const endpoint = `${url.protocol}//${url.host}/api/${projectId}/store/`
    return { endpoint, publicKey }
  } catch {
    return null
  }
}

function dsn(): string | undefined {
  return process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || undefined
}

export function isErrorTrackingEnabled(): boolean {
  return Boolean(dsn())
}

function normalizeError(err: unknown): { type: string; value: string; stack?: string } {
  if (err instanceof Error) {
    return { type: err.name || "Error", value: err.message, stack: err.stack }
  }
  return { type: "UnknownError", value: typeof err === "string" ? err : JSON.stringify(err) }
}

/**
 * Records an exception. Always logs it in structured form; additionally forwards
 * it to Sentry when a DSN is configured. Forwarding is best-effort and never
 * throws — observability must not take down a request path.
 */
export async function captureException(err: unknown, context?: LogContext): Promise<void> {
  const normalized = normalizeError(err)
  logger.error(normalized.value, { ...context, errorType: normalized.type, stack: normalized.stack })

  const configured = dsn()
  if (!configured) return // Graceful no-op without a DSN.

  const parsed = parseDsn(configured)
  if (!parsed) return

  try {
    await fetch(parsed.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": [
          "Sentry sentry_version=7",
          `sentry_key=${parsed.publicKey}`,
          "sentry_client=monytar/1.0",
        ].join(", "),
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        platform: "node",
        level: "error",
        environment: process.env.NODE_ENV || "development",
        exception: {
          values: [{ type: normalized.type, value: normalized.value }],
        },
        extra: context,
      }),
    })
  } catch (forwardError) {
    // Never let error reporting break the caller.
    logger.warn("Failed to forward exception to Sentry", {
      reason: forwardError instanceof Error ? forwardError.message : "unknown",
    })
  }
}
