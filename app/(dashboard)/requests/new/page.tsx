"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, DollarSign, FileText } from "lucide-react"
import { useData, useAuth } from "@/lib/providers"
import { generateId } from "@/lib/utils"
import { getCurrencySymbol } from "@/lib/currency"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { uploadReceipts } from "@/lib/receipts/client"
import { nextRequestNumber } from "@/lib/hooks/use-supabase-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReceiptUploader } from "@/components/requests/receipt-uploader"
import { toast } from "sonner"
import type { ExpenseCategory, Priority } from "@/lib/types"
import Link from "next/link"

export default function NewRequestPage() {
  const router = useRouter()
  const { dbUser } = useAuth()
  const { currentUser, vendors, createRequest, getNextRequestNumber, organization, isDemo, currencyCode } = useData()
  const user = dbUser || currentUser
  const [amount, setAmount] = useState("")
  const [purpose, setPurpose] = useState("")
  const [category, setCategory] = useState<ExpenseCategory>("software")
  const [vendorId, setVendorId] = useState<string>("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(asDraft: boolean) {
    if (!user) return
    if (!amount || !purpose) {
      toast.error("Please fill in amount and purpose")
      return
    }
    setSubmitting(true)
    const now = new Date().toISOString()

    try {
      const orgId = organization?.id || user.organization_id
      // Real orgs get a race-safe number from the server (see
      // next_request_number() migration) — the client-side fallback used in
      // demo mode computes from whatever this user's RLS view happens to
      // include, which can collide across users/roles.
      const requestNumber = isDemo ? getNextRequestNumber() : await nextRequestNumber(orgId)
      const created = await createRequest({
        id: generateId(),
        organization_id: orgId,
        request_number: requestNumber,
        employee_id: user.id,
        department_id: user.department_id,
        vendor_id: vendorId || undefined,
        amount: Number.parseFloat(amount),
        currency: currencyCode,
        purpose,
        category,
        status: asDraft ? "draft" : "pending",
        priority,
        payment_status: "unpaid",
        expense_date: expenseDate ? `${expenseDate}T00:00:00Z` : undefined,
        due_date: dueDate || undefined,
        submitted_at: asDraft ? undefined : now,
        finance_notes: notes || undefined,
        metadata: { receipt_count: files.length },
        created_at: now,
        updated_at: now,
        // Real (non-demo) submissions go through /api/requests, which reads
        // this flag instead of `status` — the server alone decides real
        // status transitions (draft vs. pending vs. auto-approved).
        ...({ as_draft: asDraft } as Record<string, unknown>),
      })

      // Upload receipts to storage when a real backend is connected; otherwise
      // the validated files are simply captured for the demo flow.
      if (files.length > 0 && isSupabaseConfigured()) {
        try {
          await uploadReceipts(created.id, files)
        } catch (err) {
          console.error("[Receipts] upload failed:", err)
          toast.warning("Request saved, but some receipts failed to upload. You can re-add them from the request page.")
        }
      }

      toast.success(asDraft ? "Saved as draft" : "Request submitted for approval")
      router.push("/requests")
    } catch (err) {
      console.error("[Requests] create failed:", err)
      toast.error("Failed to save the request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/requests">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">New Expense Request</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Submit a new expense for approval</p>
        </div>
      </div>

      {/* Amount + Category */}
      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="pb-1 bg-secondary/30 border-b border-border/40">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <CardTitle className="font-heading text-sm font-bold">Amount & Category</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-5 flex flex-col gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount" className="text-[13px] font-medium">Amount ({currencyCode}) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">{getCurrencySymbol(currencyCode)}</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7 h-10 font-mono tabular-nums"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category" className="text-[13px] font-medium">Category *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                <SelectTrigger id="category" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="meals">Meals & Entertainment</SelectItem>
                  <SelectItem value="supplies">Office Supplies</SelectItem>
                  <SelectItem value="software">Software & Services</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purpose & Details */}
      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="pb-1 bg-secondary/30 border-b border-border/40">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <CardTitle className="font-heading text-sm font-bold">Purpose & Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="purpose" className="text-[13px] font-medium">Business Justification *</Label>
            <Textarea
              id="purpose"
              placeholder="Describe the expense and why it is needed..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="vendor" className="text-[13px] font-medium">Vendor</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger id="vendor" className="h-10">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors
                    .filter((v) => v.is_approved)
                    .map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="priority" className="text-[13px] font-medium">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger id="priority" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="expenseDate" className="text-[13px] font-medium">Expense Date</Label>
              <Input id="expenseDate" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="h-10" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dueDate" className="text-[13px] font-medium">Due Date (optional)</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes" className="text-[13px] font-medium">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any extra context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Receipts */}
      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="pb-1 bg-secondary/30 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            <CardTitle className="font-heading text-sm font-bold">Receipts</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <ReceiptUploader files={files} onChange={setFiles} disabled={submitting} />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-4">
        <Button variant="outline" disabled={submitting} className="flex-1 h-11 bg-transparent font-semibold" onClick={() => handleSubmit(true)}>
          Save as Draft
        </Button>
        <Button disabled={submitting} className="flex-1 h-11 font-semibold shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25 transition-all" onClick={() => handleSubmit(false)}>
          {submitting ? "Submitting..." : "Submit for Approval"}
        </Button>
      </div>
    </div>
  )
}
