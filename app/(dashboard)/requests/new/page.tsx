"use client"

import { Suspense, useEffect, useState } from "react"
import useSWR from "swr"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Upload, DollarSign, FileText, AlertTriangle } from "lucide-react"
import { useData, useAuth } from "@/lib/providers"
import { generateId, getCategoryLabel } from "@/lib/utils"
import { getCurrencySymbol } from "@/lib/currency"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { uploadReceipts } from "@/lib/receipts/client"
import { nextRequestNumber } from "@/lib/hooks/use-supabase-data"
import { useExpenseCategories } from "@/lib/hooks/use-categories"
import { isReceiptRequired } from "@/lib/approvals/engine"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReceiptUploader } from "@/components/requests/receipt-uploader"
import { RequestReceipts } from "@/components/requests/request-receipts"
import { toast } from "sonner"
import type { ExpenseCategory, Priority } from "@/lib/types"
import Link from "next/link"

function NewRequestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const { dbUser } = useAuth()
  const { currentUser, vendors, createRequest, updateRequest, submitRequest, getRequestWithRelations, getNextRequestNumber, organization, orgSettings, isDemo, currencyCode } = useData()
  const user = dbUser || currentUser
  const { categories } = useExpenseCategories()

  const editing = editId ? getRequestWithRelations(editId) : undefined
  // Only the owner may edit their own still-draft or rejected request —
  // everyone else (or a request that's moved past that) is bounced back.
  const canEditThis = !editId || (editing && user && editing.employee_id === user.id && (editing.status === "draft" || editing.status === "rejected"))

  // getRequestWithRelations() doesn't join receipts (that's a separate,
  // per-request fetch — see RequestReceipts) — fetch just the count here so
  // the "receipt required" check below knows about receipts already
  // attached from a previous save, not only ones picked in this session.
  const { data: existingReceiptsData } = useSWR<{ receipts?: unknown[] }>(
    editing && isSupabaseConfigured() ? `/api/receipts?request_id=${editing.id}` : null,
    (url: string) => fetch(url).then((r) => r.json()),
  )
  const existingReceiptCount = existingReceiptsData?.receipts?.length ?? 0

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
  const [loadedEdit, setLoadedEdit] = useState(false)

  // Pre-fill the form once the request being edited is available.
  useEffect(() => {
    if (editing && !loadedEdit) {
      setAmount(String(editing.amount))
      setPurpose(editing.purpose || "")
      setCategory(editing.category)
      setVendorId(editing.vendor_id || "")
      setPriority(editing.priority)
      setExpenseDate(editing.expense_date ? editing.expense_date.split("T")[0] : "")
      setDueDate(editing.due_date || "")
      setNotes(editing.finance_notes || "")
      setLoadedEdit(true)
    }
  }, [editing, loadedEdit])

  // Computed reactively (not just checked at submit time) so the Receipts
  // card can show a persistent notice instead of relying on a toast someone
  // can miss — a missed toast plus the button reverting to its normal
  // resting label reads as "stuck", not "blocked, here's why".
  const receiptStillNeeded =
    !!orgSettings &&
    files.length === 0 &&
    existingReceiptCount === 0 &&
    isReceiptRequired(Number.parseFloat(amount) || 0, orgSettings)

  async function handleSubmit(asDraft: boolean) {
    if (!user) return
    if (!amount || !purpose) {
      toast.error("Please fill in amount and purpose")
      return
    }
    // A receipt requirement is a submission gate, not a draft one — someone
    // should always be able to save their progress and attach it later.
    if (!asDraft && receiptStillNeeded) {
      toast.error(`A receipt is required for expenses of ${getCurrencySymbol(currencyCode)}${orgSettings!.receipt_required_above_amount} or more. Attach one, or save as a draft.`)
      return
    }
    setSubmitting(true)
    const now = new Date().toISOString()

    try {
      const fields = {
        vendor_id: vendorId || undefined,
        amount: Number.parseFloat(amount),
        currency: currencyCode,
        purpose,
        category,
        priority,
        expense_date: expenseDate ? `${expenseDate}T00:00:00Z` : undefined,
        due_date: dueDate || undefined,
        finance_notes: notes || undefined,
      }

      let requestId: string

      if (editing) {
        // Editing an existing draft/rejected request: update its content,
        // then optionally move it into the workflow — two separate,
        // purpose-built calls rather than one combined write (status
        // transitions carry their own auto-approve/receipt-threshold logic,
        // handled server-side in /api/requests/[id]/submit).
        await updateRequest(editing.id, fields)
        requestId = editing.id
        if (!asDraft) {
          await submitRequest(editing.id)
        }
      } else {
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
          // A user with no department assigned yet (e.g. a fresh org's
          // admin) has department_id: null — the request schema's zod field
          // is `.optional()` (accepts undefined) but not `.nullable()`, so
          // sending null as-is 400s with "Expected string, received null"
          // on literally every submission for that user.
          department_id: user.department_id || undefined,
          ...fields,
          status: asDraft ? "draft" : "pending",
          payment_status: "unpaid",
          submitted_at: asDraft ? undefined : now,
          metadata: { receipt_count: files.length },
          created_at: now,
          updated_at: now,
          // Real (non-demo) submissions go through /api/requests, which reads
          // this flag instead of `status` — the server alone decides real
          // status transitions (draft vs. pending vs. auto-approved).
          ...({ as_draft: asDraft } as Record<string, unknown>),
        })
        requestId = created.id
      }

      // Upload receipts to storage when a real backend is connected; otherwise
      // the validated files are simply captured for the demo flow.
      if (files.length > 0 && isSupabaseConfigured()) {
        try {
          await uploadReceipts(requestId, files)
        } catch (err) {
          console.error("[Receipts] upload failed:", err)
          toast.warning("Request saved, but some receipts failed to upload. You can re-add them from the request page.")
        }
      }

      toast.success(asDraft ? "Saved as draft" : "Request submitted for approval")
      router.push(editing ? `/requests/${requestId}` : "/requests")
    } catch (err) {
      console.error("[Requests] save failed:", err)
      toast.error(err instanceof Error ? err.message : "Failed to save the request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (editId && canEditThis === false) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h3 className="font-heading font-bold mb-1">Can&apos;t edit this request</h3>
        <p className="text-sm text-muted-foreground mb-4">It&apos;s no longer a draft, or isn&apos;t yours to edit.</p>
        <Link href={`/requests/${editId}`}>
          <Button variant="outline" className="bg-transparent"><ArrowLeft className="w-4 h-4 mr-2" /> Back to request</Button>
        </Link>
      </div>
    )
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
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">{editing ? "Edit Request" : "New Expense Request"}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{editing ? "Update the details, then save or submit it for approval." : "Submit a new expense for approval"}</p>
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
                  className="pl-7 h-10 font-mono text-base font-semibold text-foreground tabular-nums"
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
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{getCategoryLabel(c.name)}</SelectItem>
                  ))}
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
              <Label htmlFor="vendor" className="text-[13px] font-medium">Vendor (optional)</Label>
              <Select value={vendorId || "none"} onValueChange={(v) => setVendorId(v === "none" ? "" : v)}>
                <SelectTrigger id="vendor" className="h-10">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No vendor</SelectItem>
                  {vendors
                    .filter((v) => v.is_approved && v.is_active !== false)
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

      {/* Existing receipts (edit mode only) */}
      {editing && <RequestReceipts requestId={editing.id} fallbackReceipts={editing.receipts} requestStatus={editing.status} />}

      {/* Receipts */}
      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="pb-1 bg-secondary/30 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            <CardTitle className="font-heading text-sm font-bold">{editing ? "Add More Receipts" : "Receipts"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-5 flex flex-col gap-3">
          {receiptStillNeeded && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                A receipt is required for expenses of {getCurrencySymbol(currencyCode)}{orgSettings?.receipt_required_above_amount} or more before this can be submitted for approval. Attach one below, or save as a draft for now.
              </p>
            </div>
          )}
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

export default function NewRequestPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32"><div className="animate-pulse text-sm text-muted-foreground">Loading...</div></div>}>
      <NewRequestContent />
    </Suspense>
  )
}
