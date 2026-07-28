// Pure, environment-agnostic receipt helpers (safe for client, server, and tests).

export const RECEIPTS_BUCKET = "receipts"
export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024 // 10 MB
export const ALLOWED_RECEIPT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
] as const

export function isAllowedReceiptType(fileType: string): boolean {
  return (ALLOWED_RECEIPT_TYPES as readonly string[]).includes(fileType)
}

/** Sanitizes a filename to a safe, storage-friendly slug while keeping its extension. */
export function sanitizeFileName(fileName: string): string {
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
  const safeBase = base || "receipt"
  return ext ? `${safeBase}.${ext}` : safeBase
}

/**
 * Builds the org-scoped storage key. The first path segment is the org id, which
 * the storage RLS policy checks against the caller's organization.
 */
export function buildReceiptPath(orgId: string, requestId: string, fileName: string): string {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `${orgId}/${requestId}/${unique}-${sanitizeFileName(fileName)}`
}

/** Returns an error string if the file is invalid, or null if it's acceptable. */
export function validateReceiptMeta(fileType: string, fileSize: number): string | null {
  if (!isAllowedReceiptType(fileType)) {
    return "Unsupported file type. Use JPG, PNG, WEBP, HEIC, or PDF."
  }
  if (fileSize > MAX_RECEIPT_BYTES) {
    return "File exceeds the 10 MB limit."
  }
  if (fileSize <= 0) {
    return "File appears to be empty."
  }
  return null
}
