import { describe, it, expect } from "vitest"
import {
  sanitizeFileName,
  buildReceiptPath,
  isAllowedReceiptType,
  validateReceiptMeta,
  MAX_RECEIPT_BYTES,
  ALLOWED_RECEIPT_TYPES,
} from "@/lib/receipts/shared"
import { receiptUploadUrlSchema, receiptRecordSchema } from "@/lib/validations"

const ORG = "11111111-1111-1111-1111-111111111111"
const REQ = "22222222-2222-2222-2222-222222222222"

describe("sanitizeFileName", () => {
  it("lowercases and slugifies the base while preserving the extension", () => {
    expect(sanitizeFileName("My Receipt (Final).PDF")).toBe("my-receipt-final.pdf")
  })

  it("collapses runs of unsafe characters into single hyphens", () => {
    expect(sanitizeFileName("a   b___c!!!d.png")).toBe("a-b-c-d.png")
  })

  it("falls back to 'receipt' when the base is empty", () => {
    expect(sanitizeFileName("!!!.jpg")).toBe("receipt.jpg")
  })

  it("handles files with no extension", () => {
    expect(sanitizeFileName("invoice")).toBe("invoice")
  })

  it("trims leading/trailing hyphens", () => {
    expect(sanitizeFileName("  spaced  .pdf")).toBe("spaced.pdf")
  })
})

describe("buildReceiptPath", () => {
  it("always starts with the org id segment (tenant isolation)", () => {
    const path = buildReceiptPath(ORG, REQ, "receipt.pdf")
    expect(path.startsWith(`${ORG}/`)).toBe(true)
  })

  it("includes the request id as the second segment", () => {
    const path = buildReceiptPath(ORG, REQ, "receipt.pdf")
    expect(path.split("/")[1]).toBe(REQ)
  })

  it("produces unique paths for identical inputs", () => {
    const a = buildReceiptPath(ORG, REQ, "receipt.pdf")
    const b = buildReceiptPath(ORG, REQ, "receipt.pdf")
    expect(a).not.toBe(b)
  })

  it("sanitizes the filename portion", () => {
    const path = buildReceiptPath(ORG, REQ, "My File.PNG")
    expect(path.endsWith("my-file.png")).toBe(true)
  })
})

describe("isAllowedReceiptType", () => {
  it("accepts every allowed mime type", () => {
    for (const type of ALLOWED_RECEIPT_TYPES) {
      expect(isAllowedReceiptType(type)).toBe(true)
    }
  })

  it("rejects disallowed types", () => {
    expect(isAllowedReceiptType("application/x-msdownload")).toBe(false)
    expect(isAllowedReceiptType("text/html")).toBe(false)
    expect(isAllowedReceiptType("")).toBe(false)
  })
})

describe("validateReceiptMeta", () => {
  it("passes a valid PDF under the limit", () => {
    expect(validateReceiptMeta("application/pdf", 1024)).toBeNull()
  })

  it("rejects an unsupported type", () => {
    expect(validateReceiptMeta("text/csv", 1024)).toMatch(/unsupported/i)
  })

  it("rejects files over the size limit", () => {
    expect(validateReceiptMeta("image/png", MAX_RECEIPT_BYTES + 1)).toMatch(/10 MB/i)
  })

  it("rejects empty files", () => {
    expect(validateReceiptMeta("image/png", 0)).toMatch(/empty/i)
  })

  it("accepts a file exactly at the limit", () => {
    expect(validateReceiptMeta("image/jpeg", MAX_RECEIPT_BYTES)).toBeNull()
  })
})

describe("receiptUploadUrlSchema", () => {
  it("accepts a well-formed request", () => {
    const result = receiptUploadUrlSchema.safeParse({
      expense_request_id: REQ,
      file_name: "receipt.pdf",
      file_type: "application/pdf",
      file_size: 2048,
    })
    expect(result.success).toBe(true)
  })

  it("rejects a non-uuid request id", () => {
    const result = receiptUploadUrlSchema.safeParse({
      expense_request_id: "not-a-uuid",
      file_name: "receipt.pdf",
      file_type: "application/pdf",
      file_size: 2048,
    })
    expect(result.success).toBe(false)
  })

  it("rejects an oversized file", () => {
    const result = receiptUploadUrlSchema.safeParse({
      expense_request_id: REQ,
      file_name: "big.pdf",
      file_type: "application/pdf",
      file_size: MAX_RECEIPT_BYTES + 1,
    })
    expect(result.success).toBe(false)
  })

  it("rejects a disallowed mime type", () => {
    const result = receiptUploadUrlSchema.safeParse({
      expense_request_id: REQ,
      file_name: "script.exe",
      file_type: "application/x-msdownload",
      file_size: 2048,
    })
    expect(result.success).toBe(false)
  })
})

describe("receiptRecordSchema", () => {
  it("accepts a well-formed record", () => {
    const result = receiptRecordSchema.safeParse({
      expense_request_id: REQ,
      file_path: `${ORG}/${REQ}/123-receipt.pdf`,
      file_name: "receipt.pdf",
      file_type: "application/pdf",
      file_size: 2048,
    })
    expect(result.success).toBe(true)
  })

  it("rejects a missing file path", () => {
    const result = receiptRecordSchema.safeParse({
      expense_request_id: REQ,
      file_path: "",
      file_name: "receipt.pdf",
      file_type: "application/pdf",
      file_size: 2048,
    })
    expect(result.success).toBe(false)
  })
})
