"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Search, FileText } from "lucide-react"
import { useStore } from "@/lib/store"
import { formatCurrency, formatDate, cn, getCategoryLabel } from "@/lib/utils"
import { RequestStatusBadge } from "@/components/requests/request-status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import type { RequestStatus } from "@/lib/types"

export default function RequestsPage() {
  const { currentUser, expenseRequests, getMyRequests, getUserById, getVendorById, markRequestPaid } = useStore()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const isEmployee = currentUser.role === "employee"
  const isFinance = currentUser.role === "finance" || currentUser.role === "admin"
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
          <h1 className="text-2xl font-bold">{isEmployee ? "My Requests" : "All Requests"}</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} expense requests</p>
        </div>
        <Link href="/requests/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New Request
          </Button>
        </Link>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="flex-wrap h-auto gap-1">
          {[
            { value: "all", label: "All" },
            { value: "draft", label: "Drafts" },
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
            { value: "paid", label: "Paid" },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
              {tab.label}
              {statusCounts[tab.value] ? (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px]">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search requests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {["travel", "meals", "supplies", "software", "equipment", "other"].map((c) => (
              <SelectItem key={c} value={c}>
                {getCategoryLabel(c as any)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-medium mb-1">No requests found</h3>
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== "all" ? "Try adjusting your filters" : "Create your first expense request"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request #</TableHead>
                    {!isEmployee && <TableHead>Employee</TableHead>}
                    <TableHead>Purpose</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((req) => {
                    const emp = getUserById(req.employee_id)
                    const vendor = req.vendor_id ? getVendorById(req.vendor_id) : undefined
                    return (
                      <TableRow key={req.id} className="cursor-pointer">
                        <TableCell>
                          <Link href={`/requests/${req.id}`} className="font-medium text-primary hover:underline">
                            {req.request_number}
                          </Link>
                        </TableCell>
                        {!isEmployee && <TableCell className="text-sm">{emp?.full_name || "Unknown"}</TableCell>}
                        <TableCell className="max-w-xs">
                          <p className="text-sm truncate">{req.purpose}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{getCategoryLabel(req.category)}</TableCell>
                        <TableCell className="text-sm">{vendor?.name || "-"}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(req.amount)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
