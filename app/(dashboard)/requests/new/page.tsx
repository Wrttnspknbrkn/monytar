"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { generateId } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import type { ExpenseCategory, Priority } from "@/lib/types"
import Link from "next/link"

export default function NewRequestPage() {
  const router = useRouter()
  const { currentUser, vendors, addExpenseRequest, getNextRequestNumber } = useStore()
  const [amount, setAmount] = useState("")
  const [purpose, setPurpose] = useState("")
  const [category, setCategory] = useState<ExpenseCategory>("software")
  const [vendorId, setVendorId] = useState<string>("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [files, setFiles] = useState<string[]>([])

  function handleSubmit(asDraft: boolean) {
    if (!amount || !purpose) {
      toast.error("Please fill in amount and purpose")
      return
    }
    const now = new Date().toISOString()
    const id = generateId()
    addExpenseRequest({
      id,
      organization_id: "org-1",
      request_number: getNextRequestNumber(),
      employee_id: currentUser.id,
      department_id: currentUser.department_id,
      vendor_id: vendorId || undefined,
      amount: Number.parseFloat(amount),
      currency: "USD",
      purpose,
      category,
      status: asDraft ? "draft" : "pending",
      priority,
      payment_status: "unpaid",
      expense_date: expenseDate ? `${expenseDate}T00:00:00Z` : undefined,
      due_date: dueDate || undefined,
      submitted_at: asDraft ? undefined : now,
      finance_notes: notes || undefined,
      metadata: {},
      created_at: now,
      updated_at: now,
    })
    toast.success(asDraft ? "Saved as draft" : "Request submitted successfully")
    router.push("/requests")
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Expense Request</h1>
          <p className="text-muted-foreground text-sm">Submit a new expense for approval</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Amount (USD) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                <SelectTrigger id="category">
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="purpose">Purpose *</Label>
            <Textarea
              id="purpose"
              placeholder="Describe the expense and its business justification..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger id="vendor">
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
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger id="priority">
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
              <Label htmlFor="expenseDate">Expense Date</Label>
              <Input id="expenseDate" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dueDate">Due Date (optional)</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes or context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Receipt Upload Zone */}
          <div className="flex flex-col gap-2">
            <Label>Receipts</Label>
            <div
              className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => {
                setFiles((prev) => [...prev, `receipt-${prev.length + 1}.pdf`])
                toast.info("Receipt added (demo mode)")
              }}
            >
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Click to upload receipts</p>
              <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB</p>
            </div>
            {files.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted text-sm">
                    <span className="flex-1">{file}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6"
                      onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="outline" className="flex-1 bg-transparent" onClick={() => handleSubmit(true)}>
          Save as Draft
        </Button>
        <Button className="flex-1" onClick={() => handleSubmit(false)}>
          Submit Request
        </Button>
      </div>
    </div>
  )
}
