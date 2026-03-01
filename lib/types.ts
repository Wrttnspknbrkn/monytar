// Monytar Type Definitions

export type UserRole = "employee" | "manager" | "finance" | "admin"
export type RequestStatus = "draft" | "pending" | "approved" | "rejected" | "paid" | "cancelled"
export type PaymentStatus = "unpaid" | "processing" | "paid" | "failed"
export type Priority = "low" | "medium" | "high" | "urgent"
export type ExpenseCategory = "travel" | "meals" | "supplies" | "software" | "equipment" | "other"
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

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url?: string
  currency: string
  timezone: string
  settings: Record<string, unknown>
  subscription_tier: SubscriptionTier
  subscription_status: "active" | "inactive" | "trial" | "cancelled"
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
