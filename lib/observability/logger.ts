export type LogLevel = "debug" | "info" | "warn" | "error"

export type LogContext = Record<string, unknown>

// Keys whose values must never be written to logs, even if a caller passes them
// in a context object. Matched case-insensitively as a substring of the key.
const REDACT_KEYS = [
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "api_key",
  "apikey",
  "access_key",
  "client_secret",
  "signature",
]

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }

function minLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL || "").toLowerCase()
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") return raw
  return process.env.NODE_ENV === "production" ? "info" : "debug"
}

/**
 * Recursively redacts sensitive values from a context object so secrets never
 * reach the log sink. Non-plain values are returned as-is (already serializable).
 */
export function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== "object") return value
  if (seen.has(value as object)) return "[Circular]"
  seen.add(value as object)

  if (Array.isArray(value)) return value.map((v) => redact(v, seen))

  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    const lower = key.toLowerCase()
    if (REDACT_KEYS.some((k) => lower.includes(k))) {
      out[key] = "[REDACTED]"
    } else {
      out[key] = redact(val, seen)
    }
  }
  return out
}

function emit(level: LogLevel, message: string, context?: LogContext) {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[minLevel()]) return

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? { context: redact(context) as LogContext } : {}),
  }

  // Structured single-line JSON so log drains (Vercel/Datadog/etc.) can parse it.
  const line = JSON.stringify(entry)
  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else console.log(line)
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit("debug", message, context),
  info: (message: string, context?: LogContext) => emit("info", message, context),
  warn: (message: string, context?: LogContext) => emit("warn", message, context),
  error: (message: string, context?: LogContext) => emit("error", message, context),
}
