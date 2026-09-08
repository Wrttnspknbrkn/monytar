// Pure, environment-agnostic logo helpers (safe for client, server, and tests).
// Mirrors lib/receipts/shared.ts's structure.

export const LOGOS_BUCKET = "logos"
export const MAX_LOGO_BYTES = 2 * 1024 * 1024 // 2 MB
export const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"] as const

export function isAllowedLogoType(fileType: string): boolean {
  return (ALLOWED_LOGO_TYPES as readonly string[]).includes(fileType)
}

function sanitizeFileName(fileName: string): string {
  const dot = fileName.lastIndexOf(".")
  const base = (dot > 0 ? fileName.slice(0, dot) : fileName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
  const ext = (dot > 0 ? fileName.slice(dot + 1) : "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8)
  const safeBase = base || "logo"
  return ext ? `${safeBase}.${ext}` : safeBase
}

/**
 * Builds the org-scoped storage key. The first path segment is the org id,
 * which the storage RLS policy checks against the caller's organization.
 * A fixed name (not a timestamped one) so a re-upload overwrites the
 * previous logo instead of accumulating orphaned files.
 */
export function buildLogoPath(orgId: string, fileName: string): string {
  return `${orgId}/logo-${sanitizeFileName(fileName)}`
}

/** Returns an error string if the file is invalid, or null if it's acceptable. */
export function validateLogoMeta(fileType: string, fileSize: number): string | null {
  if (!isAllowedLogoType(fileType)) {
    return "Unsupported file type. Use JPG, PNG, WEBP, or SVG."
  }
  if (fileSize > MAX_LOGO_BYTES) {
    return "File exceeds the 2 MB limit."
  }
  if (fileSize <= 0) {
    return "File appears to be empty."
  }
  return null
}
