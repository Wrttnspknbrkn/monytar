"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Plus, Search, FileText, SlidersHorizontal } from "lucide-react"
import { useData, useAuth } from "@/lib/providers"
import { formatCurrency, formatDate, getCategoryLabel } from "@/lib/utils"
import { RequestStatusBadge } from "@/components/requests/request-status-badge"
import { RequestCard } from "@/components/requests/request-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import type { ExpenseCategory } from "@/lib/types"

export default function RequestsPage() {
  const { dbUser } = useAuth()
  const { currentUser, expenseRequests, getMyRequests, getUserById, getVendorById } = useData()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Initialize filters from URL params
  useEffect(() => {
    const status = searchParams.get("status")
    if (status && ["draft", "pending", "approved", "rejected", "paid", "cancelled"].includes(status)) {
      setStatusFilter(status)
    }
  }, [searchParams])

  const user = dbUser || currentUser
  const isEmployee = user?.role === "employee"
  const requests = isEmployee ? getMyRequests() : expenseRequests

  const filtered = useMemo(() => {
    let result = requests
    if (statusFilter !== "all") result = result.filter((r) => r.status === statusFilter)
    if (categoryFilter !== "all") result = result.filter((r) => r.category === categoryFilter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.request_number.toLowerCase().includes(q) ||
          r.purpose.toLowerCase().includes(q) ||
          getVendorById(r.vendor_id || "")?.name.toLowerCase().includes(q),
      )
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [requests, statusFilter, categoryFilter, search, getVendorById])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: requests.length }
    for (const r of requests) counts[r.status] = (counts[r.status] || 0) + 1
    return counts
  }, [requests])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">{isEmployee ? "My Requests" : "All Requests"}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{filtered.length} expense requests</p>
        </div>
        <Link href="/requests/new">
          <Button className="shadow-sm shadow-primary/25 font-semibold">
            <Plus className="w-4 h-4 mr-2" /> New Request
          </Button>
        </Link>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="h-9 gap-0.5 bg-secondary/60 p-0.5">
          {[
            { value: "all", label: "All" },
            { value: "draft", label: "Drafts" },
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
            { value: "paid", label: "Paid" },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs font-semibold h-8 px-3">
              {tab.label}
              {statusCounts[tab.value] ? (
                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-background text-muted-foreground text-[10px] font-bold tabular-nums">
                  {statusCounts[tab.value]}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(["travel", "meals", "supplies", "software", "equipment", "other"] as ExpenseCategory[]).map((c) => (
              <SelectItem key={c} value={c}>
                {getCategoryLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-4">
              <FileText className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <h3 className="font-heading font-bold mb-1">No requests found</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {search || statusFilter !== "all" ? "Try adjusting your filters" : "Create your first expense request to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((req) => {
              const emp = getUserById(req.employee_id)
              return (
                <RequestCard 
                  key={req.id} 
                  request={req} 
                  employeeName={emp?.full_name}
                  showEmployee={!isEmployee}
                />
              )
            })}
          </div>

          {/* Desktop Table View */}
          <Card className="border-border/60 overflow-hidden hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Request #</TableHead>
                    {!isEmployee && <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Employee</TableHead>}
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Purpose</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vendor</TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((req) => {
                    const emp = getUserById(req.employee_id)
                    const vendor = req.vendor_id ? getVendorById(req.vendor_id) : undefined
                    return (
                      <TableRow key={req.id} className="cursor-pointer hover:bg-secondary/40 border-border/40 transition-colors">
                        <TableCell>
                          <Link href={`/requests/${req.id}`} className="font-semibold text-primary hover:underline text-sm">
                            {req.request_number}
                          </Link>
                        </TableCell>
                        {!isEmployee && <TableCell className="text-sm">{emp?.full_name || "Unknown"}</TableCell>}
                        <TableCell className="max-w-xs">
                          <p className="text-sm truncate">{req.purpose}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{getCategoryLabel(req.category)}</TableCell>
                        <TableCell className="text-sm">{vendor?.name || "-"}</TableCell>
                        <TableCell className="text-right font-heading font-bold text-sm tabular-nums">
                          {formatCurrency(req.amount)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap tabular-nums">
                          {formatDate(req.expense_date || req.created_at)}
                        </TableCell>
                        <TableCell>
                          <RequestStatusBadge status={req.status} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
