"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type {
  User,
  UserRole,
  ExpenseRequest,
  RequestStatus,
  Vendor,
  Department,
  Notification,
  ApprovalWorkflow,
  ActivityLog,
  BudgetAlert,
  ExpenseRequestWithRelations,
} from "./types"
import {
  users as initialUsers,
  expenseRequests as initialRequests,
  vendors as initialVendors,
  departments as initialDepartments,
  notifications as initialNotifications,
  approvalWorkflows as initialWorkflows,
  activityLogs as initialLogs,
  budgetAlerts as initialAlerts,
  receipts as initialReceipts,
  organization,
  organizationSettings,
} from "./mock-data"

interface StoreState {
  currentUser: User
  users: User[]
  expenseRequests: ExpenseRequest[]
  vendors: Vendor[]
  departments: Department[]
  notifications: Notification[]
  approvalWorkflows: ApprovalWorkflow[]
  activityLogs: ActivityLog[]
  budgetAlerts: BudgetAlert[]
  orgSettings: typeof import("./mock-data").organizationSettings
}

interface StoreActions {
  switchRole: (role: UserRole) => void
  switchUser: (userId: string) => void
  // Expense requests
  addExpenseRequest: (request: ExpenseRequest) => void
  updateExpenseRequest: (id: string, updates: Partial<ExpenseRequest>) => void
  deleteExpenseRequest: (id: string) => void
  approveRequest: (id: string, comment?: string) => void
  rejectRequest: (id: string, comment: string) => void
  markRequestPaid: (id: string, paymentRef: string, paymentMethod: string) => void
  // Vendors
  addVendor: (vendor: Vendor) => void
  updateVendor: (id: string, updates: Partial<Vendor>) => void
  // Departments
  addDepartment: (dept: Department) => void
  updateDepartment: (id: string, updates: Partial<Department>) => void
  // Users
  addUser: (user: User) => void
  updateUser: (id: string, updates: Partial<User>) => void
  // Org settings
  updateOrgSettings: (updates: Partial<StoreState["orgSettings"]>) => void
  // Notifications
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  // Helpers
  getRequestWithRelations: (id: string) => ExpenseRequestWithRelations | undefined
  getMyRequests: () => ExpenseRequest[]
  getPendingApprovals: () => ExpenseRequest[]
  getDepartmentSpend: (deptId: string) => number
  getUnreadNotificationCount: () => number
  getUserById: (id: string) => User | undefined
  getVendorById: (id: string) => Vendor | undefined
  getDepartmentById: (id: string) => Department | undefined
  getNextRequestNumber: () => string
}

type Store = StoreState & StoreActions

const StoreContext = createContext<Store | undefined>(undefined)

function getRoleUser(role: UserRole, users: User[]): User {
  return users.find((u) => u.role === role) || users[0]
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[3]) // Default: employee (Alex Johnson)
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [expenseRequests, setExpenseRequests] = useState<ExpenseRequest[]>(initialRequests)
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors)
  const [departments, setDepartments] = useState<Department[]>(initialDepartments)
  const [notifs, setNotifications] = useState<Notification[]>(initialNotifications)
  const [approvalWorkflows, setApprovalWorkflows] = useState<ApprovalWorkflow[]>(initialWorkflows)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialLogs)
  const [budgetAlerts] = useState<BudgetAlert[]>(initialAlerts)
  const [orgSettings, setOrgSettings] = useState(organizationSettings)

  const switchRole = useCallback(
    (role: UserRole) => {
      const user = getRoleUser(role, users)
      setCurrentUser(user)
    },
    [users],
  )

  const switchUser = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId)
      if (user) setCurrentUser(user)
    },
    [users],
  )

  const getNextRequestNumber = useCallback(() => {
    const maxNum = expenseRequests.reduce((max, r) => {
      const num = Number.parseInt(r.request_number.split("-").pop() || "0")
      return num > max ? num : max
    }, 0)
    return `REQ-2026-${String(maxNum + 1).padStart(5, "0")}`
  }, [expenseRequests])

  const addExpenseRequest = useCallback((request: ExpenseRequest) => {
    setExpenseRequests((prev) => [request, ...prev])
  }, [])

  const updateExpenseRequest = useCallback((id: string, updates: Partial<ExpenseRequest>) => {
    setExpenseRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r)))
  }, [])

  const deleteExpenseRequest = useCallback((id: string) => {
    setExpenseRequests((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const approveRequest = useCallback(
    (id: string, comment?: string) => {
      const now = new Date().toISOString()
      setExpenseRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "approved" as RequestStatus,
                approved_by: currentUser.id,
                approved_at: now,
                manager_comment: comment || r.manager_comment,
                updated_at: now,
              }
            : r,
        ),
      )
      setApprovalWorkflows((prev) =>
        prev.map((w) =>
          w.expense_request_id === id && w.status === "pending" ? { ...w, status: "approved", comment, actioned_at: now } : w,
        ),
      )
      const req = expenseRequests.find((r) => r.id === id)
      if (req) {
        const newNotif: Notification = {
          id: `notif-${Date.now()}`,
          organization_id: "org-1",
          user_id: req.employee_id,
          type: "request_approved",
          title: "Request Approved",
          message: `Your request ${req.request_number} for $${req.amount.toLocaleString()} has been approved by ${currentUser.full_name}`,
          related_entity_type: "expense_request",
          related_entity_id: id,
          is_read: false,
          created_at: now,
        }
        setNotifications((prev) => [newNotif, ...prev])
      }
      setActivityLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          organization_id: "org-1",
          user_id: currentUser.id,
          action: "approved",
          entity_type: "expense_request",
          entity_id: id,
          details: { request_number: req?.request_number, amount: req?.amount },
          created_at: now,
        },
        ...prev,
      ])
    },
    [currentUser, expenseRequests],
  )

  const rejectRequest = useCallback(
    (id: string, comment: string) => {
      const now = new Date().toISOString()
      setExpenseRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "rejected" as RequestStatus,
                rejected_by: currentUser.id,
                rejected_at: now,
                manager_comment: comment,
                updated_at: now,
              }
            : r,
        ),
      )
      setApprovalWorkflows((prev) =>
        prev.map((w) =>
          w.expense_request_id === id && w.status === "pending" ? { ...w, status: "rejected", comment, actioned_at: now } : w,
        ),
      )
      const req = expenseRequests.find((r) => r.id === id)
      if (req) {
        const newNotif: Notification = {
          id: `notif-${Date.now()}`,
          organization_id: "org-1",
          user_id: req.employee_id,
          type: "request_rejected",
          title: "Request Rejected",
          message: `Your request ${req.request_number} for $${req.amount.toLocaleString()} has been rejected by ${currentUser.full_name}`,
          related_entity_type: "expense_request",
          related_entity_id: id,
          is_read: false,
          created_at: now,
        }
        setNotifications((prev) => [newNotif, ...prev])
      }
    },
    [currentUser, expenseRequests],
  )

  const markRequestPaid = useCallback(
    (id: string, paymentRef: string, paymentMethod: string) => {
      const now = new Date().toISOString()
      setExpenseRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "paid" as RequestStatus,
                payment_status: "paid",
                payment_date: now,
                payment_reference: paymentRef,
                payment_method: paymentMethod as ExpenseRequest["payment_method"],
                updated_at: now,
              }
            : r,
        ),
      )
      const req = expenseRequests.find((r) => r.id === id)
      if (req) {
        setNotifications((prev) => [
          {
            id: `notif-${Date.now()}`,
            organization_id: "org-1",
            user_id: req.employee_id,
            type: "payment_processed",
            title: "Payment Processed",
            message: `Payment for ${req.request_number} ($${req.amount.toLocaleString()}) has been processed. Ref: ${paymentRef}`,
            related_entity_type: "expense_request",
            related_entity_id: id,
            is_read: false,
            created_at: now,
          },
          ...prev,
        ])
      }
    },
    [expenseRequests],
  )

  const addVendor = useCallback((vendor: Vendor) => {
    setVendors((prev) => [vendor, ...prev])
  }, [])

  const updateVendor = useCallback((id: string, updates: Partial<Vendor>) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates, updated_at: new Date().toISOString() } : v)))
  }, [])

  const addDepartment = useCallback((dept: Department) => {
    setDepartments((prev) => [dept, ...prev])
  }, [])

  const updateDepartment = useCallback((id: string, updates: Partial<Department>) => {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d)))
  }, [])

  const addUser = useCallback((user: User) => {
    setUsers((prev) => [user, ...prev])
  }, [])

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates, updated_at: new Date().toISOString() } : u)))
  }, [])

  const updateOrgSettings = useCallback((updates: Partial<typeof organizationSettings>) => {
    setOrgSettings((prev) => ({ ...prev, ...updates }))
  }, [])

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    const now = new Date().toISOString()
    setNotifications((prev) => prev.map((n) => (n.user_id === currentUser.id ? { ...n, is_read: true, read_at: now } : n)))
  }, [currentUser])

  const getUserById = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users],
  )

  const getVendorById = useCallback(
    (id: string) => vendors.find((v) => v.id === id),
    [vendors],
  )

  const getDepartmentById = useCallback(
    (id: string) => departments.find((d) => d.id === id),
    [departments],
  )

  const getRequestWithRelations = useCallback(
    (id: string): ExpenseRequestWithRelations | undefined => {
      const req = expenseRequests.find((r) => r.id === id)
      if (!req) return undefined
      return {
        ...req,
        employee: users.find((u) => u.id === req.employee_id),
        vendor: req.vendor_id ? vendors.find((v) => v.id === req.vendor_id) : undefined,
        department: req.department_id ? departments.find((d) => d.id === req.department_id) : undefined,
        approver: req.approved_by
          ? users.find((u) => u.id === req.approved_by)
          : req.rejected_by
            ? users.find((u) => u.id === req.rejected_by)
            : undefined,
        receipts: initialReceipts.filter((r) => r.expense_request_id === req.id),
        approval_workflows: approvalWorkflows.filter((w) => w.expense_request_id === req.id),
      }
    },
    [expenseRequests, users, vendors, departments, approvalWorkflows],
  )

  const getMyRequests = useCallback(() => {
    return expenseRequests.filter((r) => r.employee_id === currentUser.id)
  }, [expenseRequests, currentUser])

  const getPendingApprovals = useCallback(() => {
    if (currentUser.role === "employee") return []
    if (currentUser.role === "admin" || currentUser.role === "finance") {
      return expenseRequests.filter((r) => r.status === "pending")
    }
    // Manager: get pending requests from their department employees
    const deptUsers = users.filter((u) => u.department_id === currentUser.department_id && u.id !== currentUser.id)
    const deptUserIds = new Set(deptUsers.map((u) => u.id))
    return expenseRequests.filter((r) => r.status === "pending" && deptUserIds.has(r.employee_id))
  }, [expenseRequests, currentUser, users])

  const getDepartmentSpend = useCallback(
    (deptId: string) => {
      return expenseRequests
        .filter((r) => r.department_id === deptId && (r.status === "approved" || r.status === "paid"))
        .reduce((sum, r) => sum + r.amount, 0)
    },
    [expenseRequests],
  )

  const getUnreadNotificationCount = useCallback(() => {
    return notifs.filter((n) => n.user_id === currentUser.id && !n.is_read).length
  }, [notifs, currentUser])

  const store: Store = {
    currentUser,
    users,
    expenseRequests,
    vendors,
    departments,
    notifications: notifs,
    approvalWorkflows,
    activityLogs,
    budgetAlerts,
    orgSettings,
    switchRole,
    switchUser,
    addExpenseRequest,
    updateExpenseRequest,
    deleteExpenseRequest,
    approveRequest,
    rejectRequest,
    markRequestPaid,
    addVendor,
    updateVendor,
    addDepartment,
    updateDepartment,
    addUser,
    updateUser,
    updateOrgSettings,
    markNotificationRead,
    markAllNotificationsRead,
    getRequestWithRelations,
    getMyRequests,
    getPendingApprovals,
    getDepartmentSpend,
    getUnreadNotificationCount,
    getUserById,
    getVendorById,
    getDepartmentById,
    getNextRequestNumber,
  }

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}

export { organization, organizationSettings }
