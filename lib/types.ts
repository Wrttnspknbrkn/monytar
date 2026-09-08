// Monytar Type Definitions

export type UserRole = "employee" | "manager" | "finance" | "admin"
export type RequestStatus = "draft" | "pending" | "approved" | "rejected" | "paid" | "cancelled"
export type PaymentStatus = "unpaid" | "processing" | "paid" | "failed"
export type Priority = "low" | "medium" | "high" | "urgent"
// Free-form now that organizations can add their own custom categories
// (see expense_categories table, migration 022) — no longer a fixed union.
// DEFAULT_EXPENSE_CATEGORIES below are the 6 system-wide defaults every org
// starts with; getCategoryLabel() in lib/utils.ts still special-cases them.
export type ExpenseCategory = string
export const DEFAULT_EXPENSE_CATEGORIES = ["travel", "meals", "supplies", "software", "equipment", "other"] as const

export interface ExpenseCategoryOption {
  id: string
  organization_id: string | null
  name: string
  is_active: boolean
}
export type PaymentMethod = "cash" | "bank_transfer" | "credit_card" | "check"
export type BudgetPeriod = "monthly" | "quarterly" | "yearly"
export type SubscriptionTier = "free" | "starter" | "professional" | "enterprise"
export type NotificationType =
  | "request_submitted"
  | "request_approved"
  | "request_rejected"
  | "budget_alert"
  | "payment_processed"
  | "vendor_created"
  | "user_invited"
export type AlertType = "low_budget" | "over_budget" | "approaching_limit"
export type ApprovalStatus = "pending" | "approved" | "rejected" | "skipped"

export type SubscriptionStatus = "active" | "inactive" | "trialing" | "past_due" | "canceled" | "unpaid"

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url?: string
  currency: string
  timezone: string
  settings: Record<string, unknown>
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  stripe_customer_id?: string
  stripe_subscription_id?: string
  billing_interval?: "month" | "year"
  max_users: number
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end?: boolean
  trial_end?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  organization_id: string
  email: string
  full_name: string
  avatar_url?: string
  phone?: string
  role: UserRole
  department_id?: string
  manager_id?: string
  status: "active" | "inactive" | "pending"
  last_login?: string
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  organization_id: string
  name: string
  description?: string
  manager_id?: string
  budget_amount: number
  budget_period: BudgetPeriod
  parent_department_id?: string
  is_active?: boolean
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  organization_id: string
  name: string
  category?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  tax_id?: string
  is_approved: boolean
  approval_required: boolean
  is_active?: boolean
  payment_terms?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ExpenseRequest {
  id: string
  organization_id: string
  request_number: string
  employee_id: string
  department_id?: string
  vendor_id?: string
  amount: number
  currency: string
  purpose: string
  category: ExpenseCategory
  status: RequestStatus
  priority: Priority
  payment_method?: PaymentMethod
  payment_status: PaymentStatus
  payment_date?: string
  payment_reference?: string
  due_date?: string
  expense_date?: string
  submitted_at?: string
  approved_by?: string
  approved_at?: string
  rejected_by?: string
  rejected_at?: string
  manager_comment?: string
  finance_notes?: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Receipt {
  id: string
  organization_id: string
  expense_request_id: string
  file_name: string
  file_url: string
  file_size?: number
  file_type?: string
  uploaded_by?: string
  created_at: string
}

export interface ApprovalWorkflow {
  id: string
  organization_id: string
  expense_request_id: string
  approver_id: string
  approver_role: UserRole
  sequence: number
  status: ApprovalStatus
  comment?: string
  actioned_at?: string
  created_at: string
}

export interface Notification {
  id: string
  organization_id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  related_entity_type?: string
  related_entity_id?: string
  is_read: boolean
  read_at?: string
  created_at: string
}

export interface BudgetAlert {
  id: string
  organization_id: string
  department_id: string
  alert_type: AlertType
  threshold_percentage: number
  current_spend: number
  budget_amount: number
  triggered_at: string
  resolved_at?: string
  created_at: string
}

export interface ActivityLog {
  id: string
  organization_id: string
  user_id?: string
  action: string
  entity_type: string
  entity_id?: string
  details: Record<string, unknown>
  created_at: string
}

export interface OrganizationSettings {
  id: string
  organization_id: string
  approval_threshold_amount: number
  require_manager_approval: boolean
  require_finance_approval: boolean
  auto_approve_under_amount?: number
  budget_alert_thresholds: { warning: number; critical: number; exceeded: number }
  require_receipts: boolean
  receipt_required_above_amount: number
  default_currency: string
  fiscal_year_start: string
  email_notifications_enabled: boolean
  expense_categories: string[]
}

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked"

export interface UserInvitation {
  id: string
  organization_id: string
  email: string
  role: UserRole
  department_id?: string
  invited_by?: string
  token: string
  expires_at: string
  accepted_at?: string
  status: InvitationStatus
  created_at: string
}

export interface SubscriptionHistory {
  id: string
  organization_id: string
  stripe_subscription_id?: string
  event_type: string
  previous_tier?: SubscriptionTier
  new_tier?: SubscriptionTier
  previous_status?: SubscriptionStatus
  new_status?: SubscriptionStatus
  amount_cents?: number
  currency: string
  metadata?: Record<string, unknown>
  created_at: string
}

export type DemoLeadRole = "employee" | "manager" | "finance" | "admin"

export interface DemoLead {
  id: string
  full_name: string
  email: string
  company_name?: string
  phone?: string
  entry_role: DemoLeadRole
  country?: string
  device?: string
  browser?: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  converted: boolean
  created_at: string
}

// Helper types for UI
export interface DepartmentWithManager extends Department {
  manager?: User
  current_spend: number
}

export interface ExpenseRequestWithRelations extends ExpenseRequest {
  employee?: User
  vendor?: Vendor
  department?: Department
  approver?: User
  receipts?: Receipt[]
  approval_workflows?: ApprovalWorkflow[]
}
