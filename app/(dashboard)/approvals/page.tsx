"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Clock, CheckCircle2, XCircle, AlertTriangle, Search, Inbox } from "lucide-react"
import { useStore } from "@/lib/store"
import { formatCurrency, formatRelativeTime, cn, getCategoryLabel, getInitials } from "@/lib/utils"
import { RequestStatusBadge } from "@/components/requests/request-status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function ApprovalsPage() {
  const { currentUser, getPendingApprovals, getUserById, getVendorById, approveRequest, rejectRequest } = useStore()
  const [search, setSearch] = useState("")
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState("")

  const pending = getPendingApprovals()
  const filtered = useMemo(() => {
    if (!search) return pending
    const q = search.toLowerCase()
    return pending.filter(
      (r) =>
        r.request_number.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q) ||
        getUserById(r.employee_id)?.full_name.toLowerCase().includes(q),
    )
  }, [pending, search, getUserById])

  function handleApprove(id: string) {
    approveRequest(id)
    toast.success("Request approved")
  }

  function handleReject() {
    if (!rejectId || !rejectComment.trim()) {
      toast.error("Please provide a reason")
      return
    }
    rejectRequest(rejectId, rejectComment)
    toast.success("Request rejected")
    setRejectId(null)
    setRejectComment("")
  }

  if (currentUser.role === "employee") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-4">
          <AlertTriangle className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <h3 className="font-heading font-bold mb-1">Access Restricted</h3>
        <p className="text-sm text-muted-foreground">You need manager, finance, or admin role to access approvals.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{pending.length} requests awaiting your review</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input placeholder="Search pending requests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 mb-4">
            <Inbox className="w-7 h-7 text-emerald-500" />
          </div>
          <h3 className="font-heading font-bold mb-1">All caught up</h3>
          <p className="text-sm text-muted-foreground">No pending approvals at this time.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((req) => {
            const emp = getUserById(req.employee_id)
            const vendor = req.vendor_id ? getVendorById(req.vendor_id) : undefined
            return (
              <Card key={req.id} className="border-border/60 hover:border-primary/20 transition-all duration-200 hover:shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {getInitials(emp?.full_name || "??")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link href={`/requests/${req.id}`} className="font-semibold text-sm hover:text-primary transition-colors">
                            {req.purpose}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {req.request_number} &middot; by {emp?.full_name || "Unknown"} &middot;{" "}
                            {formatRelativeTime(req.submitted_at || req.created_at)}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{getCategoryLabel(req.category)}</span>
                            {vendor && (
                              <>
                                <span>&middot;</span>
                                <span>{vendor.name}</span>
                              </>
                            )}
                            <span>&middot;</span>
                            <span className="capitalize">{req.priority} priority</span>
                          </div>
                        </div>
                        <p className="font-heading text-xl font-extrabold tracking-tight tabular-nums shrink-0">{formatCurrency(req.amount)}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <Button size="sm" onClick={() => handleApprove(req.id)} className="font-semibold shadow-sm shadow-primary/20">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Approve
                        </Button>
                        <Dialog open={rejectId === req.id} onOpenChange={(open) => { if (!open) { setRejectId(null); setRejectComment("") } }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="font-semibold bg-transparent" onClick={() => setRejectId(req.id)}>
                              <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl">
                            <DialogHeader>
                              <DialogTitle className="font-heading">Reject Request</DialogTitle>
                              <DialogDescription>Explain why this request is being rejected.</DialogDescription>
                            </DialogHeader>
                            <Textarea placeholder="Reason for rejection..." value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} rows={3} />
                            <DialogFooter>
                              <Button variant="destructive" onClick={handleReject} className="font-semibold">Confirm Rejection</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Link href={`/requests/${req.id}`} className="ml-auto">
                          <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary hover:text-primary">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
