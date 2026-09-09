"use client"

import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react"
import { mutate } from "swr"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { formatCurrency } from "@/lib/utils"
import {
  useCurrentUser,
  useOrganization,
  useOrganizationSettings,
  useUsers,
  useExpenseRequests,
  useVendors,
  useDepartments,
  useNotifications,
  useDashboardStats,
  markNotificationAsRead,
  createDepartment,
  updateDepartmentRecord,
  createVendor,
  updateVendorRecord,
  updateUserRecord,
  updateOrganizationSettingsRecord,
} from "@/lib/hooks/use-supabase-data"
import {
  useExpenseRequestsRealtime,
  useNotificationsRealtime,
  useOrganizationRealtime,
} from "@/lib/hooks/use-realtime"
import type {
  User,
  UserRole,
  ExpenseRequest,
  Vendor,
  Department,
  Notification,
  Organization,
  OrganizationSettings,
  ExpenseRequestWithRelations,
} from "@/lib/types"

// Import mock data for demo mode
import {
  users as mockUsers,
  expenseRequests as mockRequests,
  vendors as mockVendors,
  departments as mockDepartments,
  notifications as mockNotifications,
  organization as mockOrganization,
  organizationSettings as mockSettings,
  budgetAlerts as mockBudgetAlerts,
} from "@/lib/mock-data"
import type { BudgetAlert } from "@/lib/types"

interface DataContextValue {
  // State
  isLoading: boolean
  isDemo: boolean
  currentUser: User | null
  organization: Organization | null
  orgSettings: OrganizationSettings | null
  users: User[]
  expenseRequests: ExpenseRequest[]
  vendors: Vendor[]
  departments: Department[]
  notifications: Notification[]
  budgetAlerts: BudgetAlert[]
  dashboardStats: {
    pending: number
    approved: number
    rejected: number
    paid: number
    total: number
    totalAmount: number
    approvedAmount: number
    pendingAmount: number
  } | null
  
  // Actions
  approveRequest: (id: string, comment?: string) => Promise<void>
  rejectRequest: (id: string, comment: string) => Promise<void>
  markPaid: (id: string, paymentRef: string, paymentMethod: string) => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  createRequest: (data: Partial<ExpenseRequest>) => Promise<ExpenseRequest>
  updateRequest: (id: string, updates: Partial<ExpenseRequest>) => Promise<ExpenseRequest>
  /** Moves a draft or rejected request into the real workflow (pending, or auto-approved). */
  submitRequest: (id: string) => Promise<{ autoApproved: boolean }>
  addExpenseRequest: (data: ExpenseRequest) => void
  addDepartment: (data: Partial<Department>) => Promise<Department | undefined>
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<Department | undefined>
  addVendor: (data: Partial<Vendor>) => Promise<Vendor | undefined>
  updateVendor: (id: string, updates: Partial<Vendor>) => Promise<Vendor | undefined>
  addUser: (data: User) => void
  updateUser: (id: string, updates: Partial<User>) => Promise<User | undefined>
  updateOrgSettings: (updates: Partial<OrganizationSettings>) => Promise<OrganizationSettings | undefined>
  
  // Helpers
  getUserById: (id: string) => User | undefined
  getVendorById: (id: string) => Vendor | undefined
  getDepartmentById: (id: string) => Department | undefined
  getRequestWithRelations: (id: string) => ExpenseRequestWithRelations | undefined
  getMyRequests: () => ExpenseRequest[]
  getPendingApprovals: () => ExpenseRequest[]
  getDepartmentSpend: (deptId: string) => number
  getUnreadNotificationCount: () => number
  getNextRequestNumber: () => string
  canUserApprove: (request: ExpenseRequest) => boolean

  // Currency — always use these instead of calling formatCurrency/formatMoney
  // directly with no currency argument. A prior audit found ~24 of 29 call
  // sites across the app doing exactly that, silently defaulting to USD
  // regardless of the organization's configured currency.
  currencyCode: string
  formatAmount: (amount: number) => string
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

interface DataProviderProps {
  children: ReactNode
}

export function DataProvider({ children }: DataProviderProps) {
  const isDemo = !isSupabaseConfigured()
  
  // Supabase data hooks (only run when Supabase is configured)
  const { data: supabaseUser, isLoading: userLoading } = useCurrentUser()
  const { data: supabaseOrg } = useOrganization(supabaseUser?.organization_id)
  const { data: supabaseSettings } = useOrganizationSettings(supabaseUser?.organization_id)
  const { data: supabaseUsers = [] } = useUsers(supabaseUser?.organization_id)
  const { data: supabaseRequests = [] } = useExpenseRequests(supabaseUser?.organization_id)
  const { data: supabaseVendors = [] } = useVendors(supabaseUser?.organization_id)
  const { data: supabaseDepts = [] } = useDepartments(supabaseUser?.organization_id)
  const { data: supabaseNotifs = [] } = useNotifications(supabaseUser?.id)
  const { data: supabaseStats } = useDashboardStats(
    supabaseUser?.organization_id,
    supabaseUser?.id,
    supabaseUser?.role
  )
  
  // Real-time subscriptions (only when Supabase is configured)
  useExpenseRequestsRealtime(supabaseUser?.organization_id)
  useNotificationsRealtime(supabaseUser?.id)
  useOrganizationRealtime(supabaseUser?.organization_id)
  
  // Resolved data (demo or real)
  const currentUser: User | null = isDemo ? mockUsers[3] : (supabaseUser ?? null) // Default to employee in demo
  const organization: Organization | null = isDemo ? (mockOrganization as unknown as Organization) : (supabaseOrg ?? null)
  const orgSettings: OrganizationSettings | null = isDemo ? (mockSettings as unknown as OrganizationSettings) : (supabaseSettings ?? null)
  const users = isDemo ? mockUsers : supabaseUsers
  const expenseRequests = isDemo ? mockRequests : supabaseRequests
  const vendors = isDemo ? mockVendors : supabaseVendors
  const departments = isDemo ? mockDepartments : supabaseDepts
  const notifications = isDemo ? mockNotifications : supabaseNotifs
  const budgetAlerts = isDemo ? mockBudgetAlerts : [] // TODO: Fetch from Supabase when implemented

  const currencyCode = orgSettings?.default_currency || organization?.currency || "USD"
  const formatAmount = useCallback((amount: number) => formatCurrency(amount, currencyCode), [currencyCode])
  
  const dashboardStats = useMemo(() => {
    if (!isDemo && supabaseStats) return supabaseStats
    
    // Calculate from mock data
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
    
    expenseRequests.forEach(r => {
      stats.total++
      stats.totalAmount += r.amount
      if (r.status === "pending") {
        stats.pending++
        stats.pendingAmount += r.amount
      } else if (r.status === "approved") {
        stats.approved++
        stats.approvedAmount += r.amount
      } else if (r.status === "rejected") {
        stats.rejected++
      } else if (r.status === "paid") {
        stats.paid++
        stats.approvedAmount += r.amount
      }
    })
    
    return stats
  }, [isDemo, supabaseStats, expenseRequests])
  
  // Actions
  //
  // Approve/reject/mark-paid/create all go through the API routes (not a
  // direct Supabase call from the browser) — those routes are where the real
  // business rules live: no self-approval, department scoping for managers,
  // status-transition guards, auto-approve threshold, and the notification/
  // budget-alert side effects. A prior audit found the client was calling
  // lib/hooks/use-supabase-data.ts functions that wrote straight to Supabase
  // with none of that — RLS alone allowed a finance/admin/manager to
  // self-approve and self-pay their own request via nothing more than their
  // own legitimate session. Do not reintroduce a direct-write path here.
  async function parseApiError(res: Response, fallback: string): Promise<never> {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || fallback)
  }

  const invalidateRequestCaches = () => {
    mutate((key: unknown) => typeof key === "string" && key.startsWith("expense-request"))
  }

  const handleApproveRequest = useCallback(async (id: string, comment?: string) => {
    if (isDemo) {
      console.warn("Demo mode: approve action simulated")
      return
    }
    const res = await fetch(`/api/requests/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    })
    if (!res.ok) await parseApiError(res, "Failed to approve request")
    invalidateRequestCaches()
  }, [isDemo])

  const handleRejectRequest = useCallback(async (id: string, comment: string) => {
    if (isDemo) {
      console.warn("Demo mode: reject action simulated")
      return
    }
    const res = await fetch(`/api/requests/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    })
    if (!res.ok) await parseApiError(res, "Failed to reject request")
    invalidateRequestCaches()
  }, [isDemo])

  const handleMarkPaid = useCallback(async (id: string, paymentRef: string, paymentMethod: string) => {
    if (isDemo) {
      console.warn("Demo mode: mark paid action simulated")
      return
    }
    const res = await fetch(`/api/requests/${id}/mark-paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_reference: paymentRef, payment_method: paymentMethod }),
    })
    if (!res.ok) await parseApiError(res, "Failed to mark request as paid")
    invalidateRequestCaches()
  }, [isDemo])

  const handleMarkNotificationRead = useCallback(async (id: string) => {
    if (isDemo) {
      console.warn("Demo mode: notification read simulated")
      return
    }
    await markNotificationAsRead(id)
  }, [isDemo])

  const handleCreateRequest = useCallback(async (data: Partial<ExpenseRequest>) => {
    if (isDemo) {
      const demoRequest = data as ExpenseRequest
      mockRequests.push(demoRequest)
      return demoRequest
    }
    // The caller may pass a client-generated placeholder id (e.g. for demo
    // mode); strip it so Postgres assigns a real UUID via the column default.
    const { id: _clientId, ...payload } = data
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error || "Failed to create request")
    invalidateRequestCaches()
    return body.data as ExpenseRequest
  }, [isDemo])

  const handleUpdateRequest = useCallback(async (id: string, updates: Partial<ExpenseRequest>) => {
    if (isDemo) {
      console.warn("Demo mode: update request simulated")
      return { id, ...updates } as ExpenseRequest
    }
    // Editing a draft's business fields (audit P2-10 — drafts used to be a
    // dead end). Goes through the validated PATCH route rather than a raw
    // client write, same reasoning as create/approve/reject/mark-paid: RLS
    // scopes WHICH rows you can touch (your own draft/rejected row), but the
    // route's field allowlist is what stops a status/approval field from
    // being smuggled in here. Status transitions themselves go through
    // /api/requests/[id]/submit instead — this never touches status.
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error || "Failed to update request")
    invalidateRequestCaches()
    return body.data as ExpenseRequest
  }, [isDemo])

  const handleSubmitRequest = useCallback(async (id: string) => {
    if (isDemo) {
      console.warn("Demo mode: submit action simulated")
      return { autoApproved: false }
    }
    const res = await fetch(`/api/requests/${id}/submit`, { method: "POST" })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error || "Failed to submit request")
    invalidateRequestCaches()
    return { autoApproved: Boolean(body.auto_approved) }
  }, [isDemo])
  
  // Helpers
  const getUserById = useCallback((id: string) => {
    return users.find(u => u.id === id)
  }, [users])
  
  const getVendorById = useCallback((id: string) => {
    return vendors.find(v => v.id === id)
  }, [vendors])
  
  const getDepartmentById = useCallback((id: string) => {
    return departments.find(d => d.id === id)
  }, [departments])
  
  const getRequestWithRelations = useCallback((id: string): ExpenseRequestWithRelations | undefined => {
    const request = expenseRequests.find(r => r.id === id)
    if (!request) return undefined
    
    return {
      ...request,
      employee: users.find(u => u.id === request.employee_id),
      vendor: request.vendor_id ? vendors.find(v => v.id === request.vendor_id) : undefined,
      department: request.department_id ? departments.find(d => d.id === request.department_id) : undefined,
      approver: request.approved_by ? users.find(u => u.id === request.approved_by) : undefined,
    }
  }, [expenseRequests, users, vendors, departments])
  
  const getMyRequests = useCallback(() => {
    if (!currentUser) return []
    return expenseRequests.filter(r => r.employee_id === currentUser.id)
  }, [expenseRequests, currentUser])
  
  const getPendingApprovals = useCallback(() => {
    if (!currentUser) return []
    
    if (currentUser.role === "employee") return []
    
    if (currentUser.role === "admin" || currentUser.role === "finance") {
      return expenseRequests.filter(r => r.status === "pending")
    }
    
    // Manager: only requests from their department
    const deptUsers = users.filter(
      u => u.department_id === currentUser.department_id && u.id !== currentUser.id
    )
    const deptUserIds = new Set(deptUsers.map(u => u.id))
    return expenseRequests.filter(r => r.status === "pending" && deptUserIds.has(r.employee_id))
  }, [expenseRequests, currentUser, users])
  
  const getDepartmentSpend = useCallback((deptId: string) => {
    return expenseRequests
      .filter(r => r.department_id === deptId && (r.status === "approved" || r.status === "paid"))
      .reduce((sum, r) => sum + r.amount, 0)
  }, [expenseRequests])
  
  const getUnreadNotificationCount = useCallback(() => {
    if (!currentUser) return 0
    return notifications.filter(n => n.user_id === currentUser.id && !n.is_read).length
  }, [notifications, currentUser])
  
  const getNextRequestNumber = useCallback(() => {
    const year = new Date().getFullYear()
    const maxNum = expenseRequests.reduce((max, r) => {
      const num = parseInt(r.request_number.split("-").pop() || "0", 10)
      return num > max ? num : max
    }, 0)
    return `REQ-${year}-${String(maxNum + 1).padStart(5, "0")}`
  }, [expenseRequests])
  
  const canUserApprove = useCallback((request: ExpenseRequest) => {
    if (!currentUser) return false
    if (request.employee_id === currentUser.id) return false
    if (request.status !== "pending") return false
    
    if (currentUser.role === "admin" || currentUser.role === "finance") {
      return true
    }
    
    if (currentUser.role === "manager") {
      const employee = users.find(u => u.id === request.employee_id)
      return employee?.department_id === currentUser.department_id
    }
    
    return false
  }, [currentUser, users])
  
  // Stub implementations for demo mode - in production these would call Supabase
  const addExpenseRequest = useCallback((data: ExpenseRequest) => {
    if (isDemo) {
      mockRequests.push(data)
    }
    // In production, this would be handled by createRequest
  }, [isDemo])
  
  const addDepartment = useCallback(async (data: Partial<Department>) => {
    if (isDemo) {
      const demoDept = data as Department
      mockDepartments.push(demoDept)
      return demoDept
    }
    // Strip any client-generated placeholder id (not a valid UUID) so
    // Postgres assigns a real one via the column default.
    const { id: _clientId, ...payload } = data
    return await createDepartment(payload)
  }, [isDemo])

  const updateDepartment = useCallback(async (id: string, updates: Partial<Department>) => {
    if (isDemo) {
      const idx = mockDepartments.findIndex(d => d.id === id)
      if (idx !== -1) {
        mockDepartments[idx] = { ...mockDepartments[idx], ...updates }
        return mockDepartments[idx]
      }
      return undefined
    }
    return await updateDepartmentRecord(id, updates)
  }, [isDemo])

  const addVendor = useCallback(async (data: Partial<Vendor>) => {
    if (isDemo) {
      const demoVendor = data as Vendor
      mockVendors.push(demoVendor)
      return demoVendor
    }
    // Strip any client-generated placeholder id (not a valid UUID) so
    // Postgres assigns a real one via the column default.
    const { id: _clientId, ...payload } = data
    return await createVendor(payload)
  }, [isDemo])

  const updateVendor = useCallback(async (id: string, updates: Partial<Vendor>) => {
    if (isDemo) {
      const idx = mockVendors.findIndex(v => v.id === id)
      if (idx !== -1) {
        mockVendors[idx] = { ...mockVendors[idx], ...updates }
        return mockVendors[idx]
      }
      return undefined
    }
    return await updateVendorRecord(id, updates)
  }, [isDemo])

  // Creating a real, login-capable user requires a server-side admin call
  // (see /api/invitations) since it must also create a Supabase Auth
  // account — that can't be done from the client. This stays demo-only;
  // the Users page calls the invitations API directly for real orgs.
  const addUser = useCallback((data: User) => {
    if (isDemo) {
      mockUsers.push(data)
    }
  }, [isDemo])

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    if (isDemo) {
      const idx = mockUsers.findIndex(u => u.id === id)
      if (idx !== -1) {
        mockUsers[idx] = { ...mockUsers[idx], ...updates }
        return mockUsers[idx]
      }
      return undefined
    }
    return await updateUserRecord(id, updates)
  }, [isDemo])

  const updateOrgSettings = useCallback(async (updates: Partial<OrganizationSettings>) => {
    if (isDemo && mockSettings) {
      Object.assign(mockSettings, updates)
      return mockSettings as unknown as OrganizationSettings
    }
    if (!organization?.id) {
      // Org hasn't finished loading yet — throw instead of silently no-op'ing
      // so callers don't report success for a change that never saved.
      throw new Error("Organization not loaded yet. Please wait a moment and try again.")
    }
    return await updateOrganizationSettingsRecord(organization.id, updates)
  }, [isDemo, organization])
  
  const value: DataContextValue = {
    isLoading: !isDemo && userLoading,
    isDemo,
    currentUser,
    organization,
    orgSettings,
    users,
    expenseRequests,
    vendors,
    departments,
    notifications,
    budgetAlerts,
    dashboardStats,
    approveRequest: handleApproveRequest,
    rejectRequest: handleRejectRequest,
    markPaid: handleMarkPaid,
    markNotificationRead: handleMarkNotificationRead,
    createRequest: handleCreateRequest,
    updateRequest: handleUpdateRequest,
    submitRequest: handleSubmitRequest,
    addExpenseRequest,
    addDepartment,
    updateDepartment,
    addVendor,
    updateVendor,
    addUser,
    updateUser,
    updateOrgSettings,
    getUserById,
    getVendorById,
    getDepartmentById,
    getRequestWithRelations,
    getMyRequests,
    getPendingApprovals,
    getDepartmentSpend,
    getUnreadNotificationCount,
    getNextRequestNumber,
    canUserApprove,
    currencyCode,
    formatAmount,
  }
  
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) {
    throw new Error("useData must be used within DataProvider")
  }
  return ctx
}
