import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  orgName: z.string().min(2, "Organization name is required"),
  orgSize: z.string().optional(),
  // Enterprise isn't self-serve (no Stripe price, routes to contact sales
  // instead), so it's not a valid signup-time selection.
  tier: z.enum(["free", "starter", "professional"]).optional().default("free"),
})

export const expenseRequestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  amount: z.number().positive("Amount must be positive").max(1000000, "Amount too large"),
  category: z.enum(["travel", "meals", "supplies", "software", "equipment", "other"]),
  vendor_id: z.string().optional(),
  department_id: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  receipt_urls: z.array(z.string().url()).optional(),
  business_justification: z.string().min(5).max(1000).optional(),
})

export const vendorSchema = z.object({
  name: z.string().min(2, "Vendor name is required").max(200),
  contact_email: z.string().email("Valid email required").optional().or(z.literal("")),
  contact_phone: z.string().max(20).optional().or(z.literal("")),
  website: z.string().url("Valid URL required").optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  tax_id: z.string().max(50).optional().or(z.literal("")),
  payment_terms: z.string().max(100).optional().or(z.literal("")),
  category: z.string().max(100).optional().or(z.literal("")),
  is_active: z.boolean().default(true),
})

export const departmentSchema = z.object({
  name: z.string().min(2, "Department name is required").max(200),
  budget_amount: z.number().nonnegative("Budget must be non-negative"),
  budget_period: z.enum(["monthly", "quarterly", "yearly"]).default("monthly"),
  manager_id: z.string().optional(),
})

export const userSchema = z.object({
  full_name: z.string().min(2, "Name is required").max(200),
  email: z.string().email("Valid email required"),
  role: z.enum(["employee", "manager", "finance", "admin"]).default("employee"),
  department_id: z.string().optional(),
  is_active: z.boolean().default(true),
})

export const approvalSchema = z.object({
  comment: z.string().max(1000).optional(),
})

export const rejectSchema = z.object({
  comment: z.string().min(5, "Rejection reason is required").max(1000),
})

export const paymentSchema = z.object({
  payment_reference: z.string().min(1, "Payment reference is required").max(100),
  payment_method: z.enum(["cash", "bank_transfer", "credit_card", "check"]),
})

const RECEIPT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"] as const
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024 // 10 MB

// Requests a signed upload target for a specific expense request.
export const receiptUploadUrlSchema = z.object({
  expense_request_id: z.string().uuid("A valid request id is required"),
  file_name: z.string().min(1, "File name is required").max(255),
  file_type: z.enum(RECEIPT_MIME_TYPES, {
    errorMap: () => ({ message: "Unsupported file type. Use JPG, PNG, WEBP, HEIC, or PDF." }),
  }),
  file_size: z
    .number()
    .int()
    .positive("File size must be positive")
    .max(MAX_RECEIPT_BYTES, "File exceeds the 10 MB limit"),
})

// Records a receipt row after the file has been uploaded to storage.
export const receiptRecordSchema = z.object({
  expense_request_id: z.string().uuid(),
  file_path: z.string().min(1).max(500),
  file_name: z.string().min(1).max(255),
  file_type: z.enum(RECEIPT_MIME_TYPES),
  file_size: z.number().int().positive().max(MAX_RECEIPT_BYTES),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ExpenseRequestInput = z.infer<typeof expenseRequestSchema>
export type VendorInput = z.infer<typeof vendorSchema>
export type DepartmentInput = z.infer<typeof departmentSchema>
export type UserInput = z.infer<typeof userSchema>
export type ApprovalInput = z.infer<typeof approvalSchema>
export type RejectInput = z.infer<typeof rejectSchema>
export type PaymentInput = z.infer<typeof paymentSchema>
export type ReceiptUploadUrlInput = z.infer<typeof receiptUploadUrlSchema>
export type ReceiptRecordInput = z.infer<typeof receiptRecordSchema>
