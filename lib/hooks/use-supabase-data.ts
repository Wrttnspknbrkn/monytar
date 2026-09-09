"use client"

import useSWR, { mutate } from "swr"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import type {
  User,
  ExpenseRequest,
  Vendor,
  Department,
  Notification,
  Organization,
  OrganizationSettings,
  ExpenseRequestWithRelations,
} from "@/lib/types"

// PostgREST caps the rows a single request returns (commonly 1000). Any
// query fetching a whole org's table with no .range()/.limit() silently
// truncates past that cap instead of erroring — for expense_requests, that
// understates real totals (stats, reports) with no signal anything is wrong.
// This loops with .range() until a page comes back short, so the result is
// always complete regardless of how large an org's data gets.
const FETCH_ALL_PAGE_SIZE = 1000

async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const all: T[] = []
  let from = 0
  for (;;) {
    const { data, error } = await buildQuery(from, from + FETCH_ALL_PAGE_SIZE - 1)
    if (error) throw error
    const rows = data || []
    all.push(...rows)
    if (rows.length < FETCH_ALL_PAGE_SIZE) break
    from += FETCH_ALL_PAGE_SIZE
  }
  return all
}

// Generic fetcher for Supabase
async function supabaseFetcher<T>(key: string): Promise<T> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured")
  }
  
  const supabase = getSupabaseBrowserClient()
  const [table, ...filters] = key.split(":")
  
  let query = supabase.from(table).select("*")
  
  // Parse filters from key
  filters.forEach(filter => {
    const [field, op, value] = filter.split("|")
    if (op === "eq") {
      query = query.eq(field, value)
    } else if (op === "in") {
      query = query.in(field, value.split(","))
    } else if (op === "order") {
      query = query.order(field, { ascending: value === "asc" })
    }
  })
  
  const { data, error } = await query
  
  if (error) throw error
  return data as T
}

// Hook: Current authenticated user with organization
export function useCurrentUser() {
  return useSWR<User | null>(
    isSupabaseConfigured() ? "current-user" : null,
    async () => {
      const supabase = getSupabaseBrowserClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) return null
      
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single()
      
      if (error) throw error
      return data
    },
    { revalidateOnFocus: true }
  )
}

// Hook: Organization details
export function useOrganization(orgId: string | undefined) {
  return useSWR<Organization | null>(
    orgId && isSupabaseConfigured() ? `organization:${orgId}` : null,
    async () => {
      if (!orgId) return null
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single()
      
      if (error) throw error
      return data
    }
  )
}

// Hook: Organization settings
export function useOrganizationSettings(orgId: string | undefined) {
  return useSWR<OrganizationSettings | null>(
    orgId && isSupabaseConfigured() ? `organization_settings:${orgId}` : null,
    async () => {
      if (!orgId) return null
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("organization_settings")
        .select("*")
        .eq("organization_id", orgId)
        .single()
      
      if (error && error.code !== "PGRST116") throw error
      return data
    }
  )
}

// Hook: Users in organization
export function useUsers(orgId: string | undefined) {
  return useSWR<User[]>(
    orgId && isSupabaseConfigured() ? `users:organization_id|eq|${orgId}` : null,
    supabaseFetcher<User[]>,
    { fallbackData: [] }
  )
}

// Hook: Expense requests with filters
export function useExpenseRequests(
  orgId: string | undefined,
  filters?: {
    status?: string | string[]
    employeeId?: string
    departmentId?: string
  }
) {
  const key = orgId && isSupabaseConfigured()
    ? `expense-requests:${orgId}:${JSON.stringify(filters || {})}`
    : null

  return useSWR<ExpenseRequest[]>(
    key,
    async () => {
      if (!orgId) return []
      const supabase = getSupabaseBrowserClient()

      return fetchAllRows<ExpenseRequest>((from, to) => {
        let query = supabase
          .from("expense_requests")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false })
          .range(from, to)

        if (filters?.status) {
          if (Array.isArray(filters.status)) {
            query = query.in("status", filters.status)
          } else {
            query = query.eq("status", filters.status)
          }
        }

        if (filters?.employeeId) {
          query = query.eq("employee_id", filters.employeeId)
        }

        if (filters?.departmentId) {
          query = query.eq("department_id", filters.departmentId)
        }

        return query
      })
    },
    { fallbackData: [] }
  )
}

// Hook: Single expense request with relations
export function useExpenseRequest(requestId: string | undefined) {
  return useSWR<ExpenseRequestWithRelations | null>(
    requestId && isSupabaseConfigured() ? `expense-request:${requestId}` : null,
    async () => {
      if (!requestId) return null
      const supabase = getSupabaseBrowserClient()
      
      const { data, error } = await supabase
        .from("expense_requests")
        .select(`
          *,
          employee:users!expense_requests_employee_id_fkey(*),
          vendor:vendors(*),
          department:departments(*),
          approver:users!expense_requests_approved_by_fkey(*),
          receipts(*),
          approval_workflows(*)
        `)
        .eq("id", requestId)
        .single()
      
      if (error) throw error
      return data
    }
  )
}

// Hook: Vendors
export function useVendors(orgId: string | undefined) {
  return useSWR<Vendor[]>(
    orgId && isSupabaseConfigured() ? `vendors:organization_id|eq|${orgId}` : null,
    supabaseFetcher<Vendor[]>,
    { fallbackData: [] }
  )
}

// Hook: Departments
export function useDepartments(orgId: string | undefined) {
  return useSWR<Department[]>(
    orgId && isSupabaseConfigured() ? `departments:organization_id|eq|${orgId}` : null,
    supabaseFetcher<Department[]>,
    { fallbackData: [] }
  )
}

// Hook: Notifications
export function useNotifications(userId: string | undefined) {
  return useSWR<Notification[]>(
    userId && isSupabaseConfigured() ? `notifications:user_id|eq|${userId}` : null,
    async () => {
      if (!userId) return []
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)
      
      if (error) throw error
      return data || []
    },
    { fallbackData: [] }
  )
}

// Hook: Dashboard stats
export function useDashboardStats(orgId: string | undefined, userId: string | undefined, role: string | undefined) {
  return useSWR(
    orgId && userId && isSupabaseConfigured() ? `dashboard-stats:${orgId}:${userId}:${role}` : null,
    async () => {
      const supabase = getSupabaseBrowserClient()

      // Get request counts by status
      const requests = await fetchAllRows<{ status: string; amount: number }>((from, to) =>
        supabase
          .from("expense_requests")
          .select("status, amount")
          .eq("organization_id", orgId)
          .range(from, to),
      )

      const stats = {
        pending: 0,
        approved: 0,
        rejected: 0,
        paid: 0,
        total: 0,
        totalAmount: 0,
        approvedAmount: 0,
        pendingAmount: 0,
      }
      
      requests?.forEach(r => {
        stats.total++
        stats.totalAmount += Number(r.amount)
        if (r.status === "pending") {
          stats.pending++
          stats.pendingAmount += Number(r.amount)
        } else if (r.status === "approved") {
          stats.approved++
          stats.approvedAmount += Number(r.amount)
        } else if (r.status === "rejected") {
          stats.rejected++
        } else if (r.status === "paid") {
          stats.paid++
          stats.approvedAmount += Number(r.amount)
        }
      })
      
      return stats
    }
  )
}

// Mutation helpers
// Race-safe request number, generated atomically server-side (see
// next_request_number() in supabase/migrations). The client-side fallback
// used elsewhere for demo mode computes from whatever requests the current
// user's RLS view happens to include, which can collide across users/roles.
export async function nextRequestNumber(orgId: string): Promise<string> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("next_request_number", { org: orgId })
  if (error) throw error
  return data as string
}

// Request creation, approval, rejection, and mark-paid all go through their
// dedicated API routes (app/api/requests, .../approve, .../reject,
// .../mark-paid) instead of a raw client insert/update — those routes are
// where the real business rules live (auto-approve threshold, no
// self-approval, department scoping, status-transition guards, notification/
// budget-alert side effects). A prior audit found equivalent raw-write
// functions here being called directly by the client with none of that
// enforcement, since RLS alone doesn't model the full state machine. Do not
// re-add createExpenseRequest/approveExpenseRequest/rejectExpenseRequest/
// markRequestAsPaid as direct-write functions — call the API routes instead.

export async function updateExpenseRequest(id: string, updates: Partial<ExpenseRequest>) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("expense_requests")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  
  if (error) throw error
  
  // Revalidate caches
  mutate((key: string) => key?.startsWith("expense-request"))
  
  return data
}

export async function markNotificationAsRead(id: string) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", id)
  
  if (error) throw error
  
  mutate((key: string) => key?.startsWith("notifications:"))
}

export async function createNotification(data: Partial<Notification>) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("notifications")
    .insert(data)

  if (error) throw error

  mutate((key: string) => key?.startsWith("notifications:"))
}

export async function createDepartment(data: Partial<Department>) {
  const supabase = getSupabaseBrowserClient()
  const { data: result, error } = await supabase
    .from("departments")
    .insert(data)
    .select()
    .single()

  if (error) throw error

  mutate((key: string) => key?.startsWith("departments:"))
  return result
}

export async function updateDepartmentRecord(id: string, updates: Partial<Department>) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("departments")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error

  mutate((key: string) => key?.startsWith("departments:"))
  return data
}

export async function createVendor(data: Partial<Vendor>) {
  const supabase = getSupabaseBrowserClient()
  const { data: result, error } = await supabase
    .from("vendors")
    .insert(data)
    .select()
    .single()

  if (error) throw error

  mutate((key: string) => key?.startsWith("vendors:"))
  return result
}

export async function updateVendorRecord(id: string, updates: Partial<Vendor>) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("vendors")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error

  mutate((key: string) => key?.startsWith("vendors:"))
  return data
}

export async function updateUserRecord(id: string, updates: Partial<User>) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error

  mutate((key: string) => key?.startsWith("users:") || key === "current-user")
  return data
}

export async function updateOrganizationSettingsRecord(orgId: string, updates: Partial<OrganizationSettings>) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("organization_settings")
    .update(updates)
    .eq("organization_id", orgId)
    .select()
    .single()

  if (error) throw error

  mutate(`organization_settings:${orgId}`)
  return data
}
