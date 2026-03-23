"use client"

import { useMemo, useState } from "react"
import {
  Bell,
  CheckCircle2,
  XCircle,
  DollarSign,
  AlertTriangle,
  UserPlus,
  Store,
  FileText,
  CheckCheck,
  Filter,
} from "lucide-react"
import { useData, useAuth } from "@/lib/providers"
import { formatRelativeTime, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import type { NotificationType } from "@/lib/types"

const typeIcons: Record<NotificationType, typeof Bell> = {
  request_submitted: FileText,
  request_approved: CheckCircle2,
  request_rejected: XCircle,
  budget_alert: AlertTriangle,
  payment_processed: DollarSign,
  vendor_created: Store,
  user_invited: UserPlus,
}

const typeColors: Record<NotificationType, string> = {
  request_submitted: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
  request_approved: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
  request_rejected: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
  budget_alert: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
  payment_processed: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
  vendor_created: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
  user_invited: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
}

export default function NotificationsPage() {
  const router = useRouter()
  const { dbUser } = useAuth()
  const { currentUser, notifications, markNotificationRead } = useData()
  const [filter, setFilter] = useState<string>("all")

  const user = dbUser || currentUser
  const myNotifs = useMemo(
    () => user ? notifications.filter((n) => n.user_id === user.id) : [],
    [notifications, user],
  )

  const filtered = useMemo(() => {
    if (filter === "all") return myNotifs
    if (filter === "unread") return myNotifs.filter((n) => !n.is_read)
    return myNotifs.filter((n) => n.type === filter)
  }, [myNotifs, filter])

  const unreadCount = myNotifs.filter((n) => !n.is_read).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="font-semibold" onClick={async () => {
            for (const n of myNotifs.filter(n => !n.is_read)) {
              await markNotificationRead(n.id)
            }
          }}>
            <CheckCheck className="w-3.5 h-3.5 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="h-9 gap-0.5 bg-secondary/60 p-0.5">
          {[
            { value: "all", label: "All" },
            { value: "unread", label: "Unread" },
            { value: "request_approved", label: "Approved" },
            { value: "request_rejected", label: "Rejected" },
            { value: "payment_processed", label: "Payments" },
            { value: "budget_alert", label: "Alerts" },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs font-semibold h-8 px-3">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-4">
            <Bell className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <h3 className="font-heading font-bold mb-1">No notifications</h3>
          <p className="text-sm text-muted-foreground">
            {filter === "unread" ? "All notifications have been read." : "Nothing to show for this filter."}
          </p>
        </div>
      ) : (
        <Card className="border-border/60 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col divide-y divide-border/40">
              {filtered.map((notif) => {
                const Icon = typeIcons[notif.type] || Bell
                const colorClass = typeColors[notif.type] || "bg-secondary text-muted-foreground"
                return (
                  <button
                    key={notif.id}
                    type="button"
                    className={cn(
                      "flex items-start gap-4 p-4 text-left hover:bg-secondary/40 transition-colors duration-200",
                      !notif.is_read && "bg-primary/[0.02]",
                    )}
                    onClick={() => {
                      markNotificationRead(notif.id)
                      if (notif.related_entity_type === "expense_request" && notif.related_entity_id) {
                        router.push(`/requests/${notif.related_entity_id}`)
                      }
                    }}
                  >
                    <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg shrink-0", colorClass)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-sm shadow-primary/30" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium", !notif.is_read && "font-semibold")}>{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1.5 tabular-nums">{formatRelativeTime(notif.created_at)}</p>
                        </div>
                      </div>
                    </div>
                    {!notif.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-auto py-1 px-2 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          markNotificationRead(notif.id)
                        }}
                      >
                        Mark read
                      </Button>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
