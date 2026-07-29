"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clock, CheckCircle2, XCircle, FileText, DollarSign, User, Building2, MessageSquare, CreditCard } from "lucide-react"
import { useData, useAuth } from "@/lib/providers"
import { formatCurrency, formatDateTime, formatRelativeTime, getCategoryLabel, getRoleLabel, cn } from "@/lib/utils"
import { RequestStatusBadge } from "@/components/requests/request-status-badge"
import { RequestReceipts } from "@/components/requests/request-receipts"
import { ApprovalChain } from "@/components/requests/approval-chain"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { dbUser } = useAuth()
  const { currentUser, getRequestWithRelations, approveRequest, rejectRequest, markPaid, canUserApprove, orgSettings, updateRequest } = useData()
  const [comment, setComment] = useState("")
  const [rejectComment, setRejectComment] = useState("")
  const [payRef, setPayRef] = useState("")
  const [payMethod, setPayMethod] = useState("bank_transfer")
  const [isProcessing, setIsProcessing] = useState(false)

  const user = dbUser || currentUser
  const request = getRequestWithRelations(id)
  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-4">
          <FileText className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <h3 className="font-heading font-bold mb-1">Request not found</h3>
        <p className="text-sm text-muted-foreground mb-4">The request you are looking for does not exist.</p>
        <Link href="/requests">
          <Button variant="outline" className="bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Requests
          </Button>
        </Link>
      </div>
    )
  }

  const canApprove = user && canUserApprove(request)
  const canPay = user && (user.role === "finance" || user.role === "admin") && request.status === "approved"
  // The requester may revise and resubmit a rejected request.
  const canResubmit = user && request.employee_id === user.id && request.status === "rejected"

  async function handleResubmit() {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      await updateRequest(id, {
        status: "pending",
        rejected_by: undefined,
        rejected_at: undefined,
        manager_comment: undefined,
        submitted_at: new Date().toISOString(),
      })
      toast.success("Request resubmitted for approval")
    } catch {
      toast.error("Failed to resubmit request")
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleApprove() {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      await approveRequest(id, comment || undefined)
      toast.success("Request approved successfully")
      setComment("")
    } catch {
      toast.error("Failed to approve request")
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleReject() {
    if (!rejectComment.trim()) {
      toast.error("Please provide a reason for rejection")
      return
    }
    if (isProcessing) return
    setIsProcessing(true)
    try {
      await rejectRequest(id, rejectComment)
      toast.success("Request rejected")
      setRejectComment("")
    } catch {
      toast.error("Failed to reject request")
    } finally {
      setIsProcessing(false)
    }
  }

  async function handlePay() {
    if (!payRef.trim()) {
      toast.error("Please enter a payment reference")
      return
    }
    if (isProcessing) return
    setIsProcessing(true)
    try {
      await markPaid(id, payRef, payMethod)
      toast.success("Payment processed successfully")
    } catch {
      toast.error("Failed to process payment")
    } finally {
      setIsProcessing(false)
    }
  }

  const timeline = [
    { label: "Created", date: request.created_at, icon: FileText, done: true },
    ...(request.submitted_at ? [{ label: "Submitted", date: request.submitted_at, icon: Clock, done: true }] : []),
    ...(request.approved_at
      ? [{ label: `Approved by ${request.approver?.full_name || "Unknown"}`, date: request.approved_at, icon: CheckCircle2, done: true }]
      : []),
    ...(request.rejected_at
      ? [{ label: `Rejected by ${request.approver?.full_name || "Unknown"}`, date: request.rejected_at, icon: XCircle, done: true }]
      : []),
    ...(request.payment_date ? [{ label: "Payment processed", date: request.payment_date, icon: DollarSign, done: true }] : []),
  ]

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/requests">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-extrabold tracking-tight">{request.request_number}</h1>
              <RequestStatusBadge status={request.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{request.purpose}</p>
          </div>
        </div>
        <p className="font-heading text-3xl font-extrabold tracking-tight tabular-nums">{formatCurrency(request.amount, request.currency)}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main details */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base font-bold">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-y-5 gap-x-8">
                {[
                  { label: "Category", value: getCategoryLabel(request.category) },
                  { label: "Priority", value: request.priority.charAt(0).toUpperCase() + request.priority.slice(1) },
                  { label: "Vendor", value: request.vendor?.name || "N/A" },
                  { label: "Department", value: request.department?.name || "N/A" },
                  { label: "Expense Date", value: request.expense_date ? formatDateTime(request.expense_date) : "N/A" },
                  { label: "Due Date", value: request.due_date ? formatDateTime(request.due_date) : "N/A" },
                  { label: "Payment Status", value: request.payment_status.charAt(0).toUpperCase() + request.payment_status.slice(1) },
                  { label: "Payment Method", value: request.payment_method || "N/A" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
                    <p className="text-sm font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
              {request.manager_comment && (
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                    <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Reviewer Comment</p>
                      <p className="text-sm">{request.manager_comment}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Receipts */}
          <RequestReceipts requestId={id} fallbackReceipts={request.receipts} />

          {/* Resubmit (owner of a rejected request) */}
          {canResubmit && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-base font-bold">Revise &amp; Resubmit</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  This request was rejected. Address the reviewer&apos;s comment above, then resubmit it for approval.
                </p>
                <Button onClick={handleResubmit} disabled={isProcessing} className="font-semibold shadow-sm shadow-primary/20">
                  <Clock className="w-4 h-4 mr-2" /> {isProcessing ? "Resubmitting..." : "Resubmit for Approval"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {(canApprove || canPay) && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-base font-bold">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {canApprove && (
                  <div className="flex flex-col gap-4">
                    <Textarea
                      placeholder="Add a comment (optional for approval, required for rejection)..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex items-center gap-3">
                      <Button onClick={handleApprove} className="flex-1 font-semibold shadow-sm shadow-primary/20">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" className="flex-1 font-semibold">
                            <XCircle className="w-4 h-4 mr-2" /> Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl">
                          <DialogHeader>
                            <DialogTitle className="font-heading">Reject Request</DialogTitle>
                            <DialogDescription>Please provide a reason for rejecting this request.</DialogDescription>
                          </DialogHeader>
                          <Textarea
                            placeholder="Reason for rejection..."
                            value={rejectComment}
                            onChange={(e) => setRejectComment(e.target.value)}
                            rows={3}
                          />
                          <DialogFooter>
                            <Button variant="destructive" onClick={handleReject} className="font-semibold">
                              Confirm Rejection
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}
                {canPay && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full font-semibold shadow-sm shadow-primary/20">
                        <CreditCard className="w-4 h-4 mr-2" /> Process Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="font-heading">Process Payment</DialogTitle>
                        <DialogDescription>Mark this expense as paid for {formatCurrency(request.amount, request.currency)}.</DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <Label className="text-[13px] font-medium">Payment Reference</Label>
                          <Input placeholder="e.g. TXN-12345" value={payRef} onChange={(e) => setPayRef(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className="text-[13px] font-medium">Payment Method</Label>
                          <Select value={payMethod} onValueChange={setPayMethod}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="credit_card">Credit Card</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handlePay} className="font-semibold shadow-sm shadow-primary/20">
                          Confirm Payment
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {/* Employee Info */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base font-bold">Submitted By</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {request.employee?.full_name?.slice(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{request.employee?.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{request.employee?.email}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  <span>{getRoleLabel(request.employee?.role || "employee")}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{request.department?.name || "No department"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Chain */}
          {orgSettings && <ApprovalChain request={request} settings={orgSettings} />}

          {/* Timeline */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base font-bold">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-0">
                {timeline.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <div key={index} className="flex gap-3 pb-4 last:pb-0 relative">
                      {index < timeline.length - 1 && (
                        <div className="absolute left-[11px] top-6 w-[2px] h-[calc(100%-12px)] bg-border" />
                      )}
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary border border-border shrink-0 z-10">
                        <Icon className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(item.date)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
