import { cn, getStatusColor } from "@/lib/utils"
import type { RequestStatus } from "@/lib/types"

interface RequestStatusBadgeProps {
  status: RequestStatus
  className?: string
}

const statusLabels: Record<RequestStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
  cancelled: "Cancelled",
}

export function RequestStatusBadge({ status, className }: RequestStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        getStatusColor(status),
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  )
}
