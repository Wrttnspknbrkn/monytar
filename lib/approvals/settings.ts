import type { SupabaseClient } from "@supabase/supabase-js"

// Engine-facing settings shape with production-safe defaults. Reads from the
// `organization_settings` table but never throws if the row/columns are absent.
export interface ApprovalSettings {
  auto_approve_under_amount: number
  require_manager_approval: boolean
  require_finance_approval: boolean
  approval_threshold_amount: number
  require_receipts: boolean
  receipt_required_above_amount: number
}

export const DEFAULT_APPROVAL_SETTINGS: ApprovalSettings = {
  auto_approve_under_amount: 100,
  require_manager_approval: true,
  require_finance_approval: false,
  approval_threshold_amount: 1000,
  require_receipts: true,
  receipt_required_above_amount: 25,
}

export async function loadApprovalSettings(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<ApprovalSettings> {
  const { data } = await supabase
    .from("organization_settings")
    .select(
      "auto_approve_under_amount, require_manager_approval, require_finance_approval, require_receipts, receipt_required_above_amount, approval_threshold_amount",
    )
    .eq("organization_id", organizationId)
    .single()

  if (!data) return DEFAULT_APPROVAL_SETTINGS

  return {
    auto_approve_under_amount:
      numberOr(data.auto_approve_under_amount, DEFAULT_APPROVAL_SETTINGS.auto_approve_under_amount),
    require_manager_approval:
      boolOr(data.require_manager_approval, DEFAULT_APPROVAL_SETTINGS.require_manager_approval),
    require_finance_approval:
      boolOr(data.require_finance_approval, DEFAULT_APPROVAL_SETTINGS.require_finance_approval),
    approval_threshold_amount:
      numberOr(data.approval_threshold_amount, DEFAULT_APPROVAL_SETTINGS.approval_threshold_amount),
    require_receipts: boolOr(data.require_receipts, DEFAULT_APPROVAL_SETTINGS.require_receipts),
    receipt_required_above_amount: numberOr(
      data.receipt_required_above_amount,
      DEFAULT_APPROVAL_SETTINGS.receipt_required_above_amount,
    ),
  }
}

function numberOr(value: unknown, fallback: number): number {
  const n = typeof value === "string" ? Number(value) : (value as number)
  return typeof n === "number" && Number.isFinite(n) ? n : fallback
}

function boolOr(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}
