import { cn } from "@/lib/utils"
import type { RequestStatus } from "@/lib/types"

interface RequestStatusBadgeProps {
  status: RequestStatus
  className?: string
}

const statusConfig: Record<RequestStatus, { label: string; dot: string; bg: string }> = {
  draft: {
    label: "Draft",
    dot: "bg-gray-400",
    bg: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-700",
  },
  pending: {
    label: "Pending",
    dot: "bg-amber-500",
    bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  },
  approved: {
    label: "Approved",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  },
  rejected: {
    label: "Rejected",
    dot: "bg-red-500",
    bg: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  },
  paid: {
    label: "Paid",
    dot: "bg-blue-500",
    bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-gray-400",
    bg: "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400 dark:border-gray-700",
  },
}

export function RequestStatusBadge({ status, className }: RequestStatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-semibold uppercase tracking-wider",
        config.bg,
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  )
}
