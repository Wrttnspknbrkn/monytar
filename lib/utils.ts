import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isAfter, parseISO } from "date-fns"
import type { RequestStatus, Priority, ExpenseCategory, UserRole } from "./types"
import { formatMoney } from "./currency"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "USD"): string {
  // Delegates to the multi-currency formatter (locale-aware, correct decimals).
  return formatMoney(amount, currency)
}

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), "MMM d, yyyy")
}

export function formatDateTime(dateString: string): string {
  return format(parseISO(dateString), "MMM d, yyyy h:mm a")
}

export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
}

export function isOverdue(dueDateString?: string): boolean {
  if (!dueDateString) return false
  return isAfter(new Date(), parseISO(dueDateString))
}

export function getStatusColor(status: RequestStatus): string {
  const colors: Record<RequestStatus, string> = {
    draft: "bg-muted text-muted-foreground",
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    cancelled: "bg-muted text-muted-foreground",
  }
  return colors[status]
}

export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    low: "text-muted-foreground",
    medium: "text-blue-600 dark:text-blue-400",
    high: "text-amber-600 dark:text-amber-400",
    urgent: "text-red-600 dark:text-red-400",
  }
  return colors[priority]
}

export function getCategoryLabel(category: ExpenseCategory): string {
  const labels: Record<string, string> = {
    travel: "Travel",
    meals: "Meals & Entertainment",
    supplies: "Office Supplies",
    software: "Software & Services",
    equipment: "Equipment",
    other: "Other",
  }
  // Custom, org-added categories aren't in this map — their stored name IS
  // already the intended display text, so fall back to it as-is.
  return labels[category] ?? category
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    employee: "Employee",
    manager: "Manager",
    finance: "Finance",
    admin: "Admin",
  }
  return labels[role]
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
