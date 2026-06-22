"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Search, Shield, Download, Users, Sparkles, TrendingUp, Building2, RefreshCw } from "lucide-react"
import { useData, useAuth } from "@/lib/providers"
import { listDemoLeads, leadsToCsv } from "@/lib/demo/leads"
import { getInitials, formatRelativeTime, cn } from "@/lib/utils"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { DemoLead, DemoLeadRole } from "@/lib/types"

const roleColors: Record<DemoLeadRole, string> = {
  employee: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  manager: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  finance: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  admin: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
}

export default function DemoLeadsPage() {
  const { dbUser } = useAuth()
  const { currentUser } = useData()
  const user = dbUser || currentUser
  const isAdmin = user?.role === "admin"

  const { data: leads = [], isLoading, mutate } = useSWR<DemoLead[]>(
    isAdmin ? "demo-leads" : null,
    listDemoLeads,
    { revalidateOnFocus: false },
  )

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")

  const filtered = useMemo(() => {
    let result = leads
    if (roleFilter !== "all") result = result.filter((l) => l.entry_role === roleFilter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          l.full_name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.company_name || "").toLowerCase().includes(q),
      )
    }
    return result
  }, [leads, roleFilter, search])

  const stats = useMemo(() => {
    const total = leads.length
    const withCompany = leads.filter((l) => l.company_name).length
    const converted = leads.filter((l) => l.converted).length
    const now = Date.now()
    const last7 = leads.filter((l) => now - new Date(l.created_at).getTime() < 7 * 864e5).length
    return { total, withCompany, converted, last7 }
  }, [leads])

  function handleExport() {
    if (filtered.length === 0) {
      toast.error("No leads to export")
      return
    }
    const csv = leadsToCsv(filtered)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `monytar-demo-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filtered.length} lead${filtered.length === 1 ? "" : "s"}`)
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-4">
          <Shield className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <h3 className="font-heading font-bold mb-1">Admin Only</h3>
        <p className="text-sm text-muted-foreground">Demo leads are visible to admins only.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Demo Leads</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            People who tried the interactive demo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => mutate()} className="font-semibold">
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} /> Refresh
          </Button>
          <Button onClick={handleExport} className="shadow-sm shadow-primary/25 font-semibold">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Total Leads" value={String(stats.total)} icon={Users} />
        <StatCard title="Last 7 Days" value={String(stats.last7)} icon={TrendingUp} />
        <StatCard title="With Company" value={String(stats.withCompany)} icon={Building2} />
        <StatCard title="Converted" value={String(stats.converted)} icon={Sparkles} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Lead</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Company</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Entered As</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Source</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Device</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary">
                          <Sparkles className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm font-semibold">{isLoading ? "Loading leads..." : "No demo leads yet"}</p>
                        <p className="text-xs text-muted-foreground max-w-xs">
                          {isLoading
                            ? ""
                            : "When visitors try the interactive demo, their details show up here."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-secondary/40 border-border/40 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                              {getInitials(lead.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{lead.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span>{lead.company_name || "-"}</span>
                          {lead.phone && <span className="text-xs text-muted-foreground">{lead.phone}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider",
                            roleColors[lead.entry_role],
                          )}
                        >
                          {lead.entry_role}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lead.utm_campaign || lead.utm_source || lead.referrer || "Direct"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {[lead.device, lead.browser].filter(Boolean).join(" · ") || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(lead.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
