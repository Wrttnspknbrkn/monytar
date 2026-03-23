"use client"

import Link from "next/link"
import { FileText, Clock, CheckCircle2, XCircle, CreditCard, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatDate, cn, getCategoryLabel } from "@/lib/utils"
import type { ExpenseRequest } from "@/lib/types"

const statusConfig = {
  draft: { icon: FileText, color: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700" },
  pending: { icon: Clock, color: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700" },
  approved: { icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700" },
  rejected: { icon: XCircle, color: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700" },
  paid: { icon: CreditCard, color: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700" },
  cancelled: { icon: XCircle, color: "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900/30 dark:text-gray-500 dark:border-gray-700" },
}

interface RequestCardProps {
  request: ExpenseRequest
  employeeName?: string
  showEmployee?: boolean
}

export function RequestCard({ request, employeeName, showEmployee = false }: RequestCardProps) {
  const config = statusConfig[request.status]
  const StatusIcon = config.icon

  return (
    <Link href={`/requests/${request.id}`}>
      <Card className="border-border/60 hover:border-primary/20 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-semibold text-primary">{request.request_number}</span>
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider",
                  config.color
                )}>
                  <StatusIcon className="w-3 h-3" />
                  {request.status}
                </span>
              </div>
              <p className="text-sm font-medium line-clamp-2 mb-2">{request.purpose}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="px-2 py-0.5 rounded bg-secondary/60">{getCategoryLabel(request.category)}</span>
                <span className="tabular-nums">{formatDate(request.created_at)}</span>
              </div>
              {showEmployee && employeeName && (
                <p className="text-xs text-muted-foreground mt-2">By {employeeName}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="font-heading font-bold text-base tabular-nums">{formatCurrency(request.amount)}</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
