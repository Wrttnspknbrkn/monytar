"use client"

import { useMemo, useState } from "react"
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  FileText,
  Download,
  ArrowUpRight,
  PieChart as PieChartIcon,
  Calendar,
} from "lucide-react"
import { useData, useAuth } from "@/lib/providers"
import { cn, getCategoryLabel } from "@/lib/utils"
import { getCurrencySymbol } from "@/lib/currency"
import {
  computeTotals,
  spendByCategory,
  countByStatus,
  topVendors,
  monthlyTrend,
  spendByDepartment,
} from "@/lib/reports/aggregate"
import { buildExpenseReport } from "@/lib/reports/export"
import { downloadCSV, downloadHTMLReport } from "@/lib/reports/download"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ExpenseRequest } from "@/lib/types"

// Reports used to have no date-range control at all — every total, chart,
// and export was silently "all time" (audit P2-12). Presets rather than a
// free-form picker: covers the real use cases without the extra UI weight.
const RANGE_OPTIONS = [
  { value: "30d", label: "Last 30 days", days: 30, months: 1 },
  { value: "90d", label: "Last 3 months", days: 90, months: 3 },
  { value: "180d", label: "Last 6 months", days: 180, months: 6 },
  { value: "365d", label: "Last 12 months", days: 365, months: 12 },
  { value: "all", label: "All time", days: null, months: 24 },
] as const

function filterByRange(requests: ExpenseRequest[], days: number | null): ExpenseRequest[] {
  if (days === null) return requests
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return requests.filter((r) => new Date(r.created_at) >= cutoff)
}
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
} from "recharts"

const CHART_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(162, 64%, 41%)",
  "hsl(35, 92%, 52%)",
  "hsl(346, 77%, 50%)",
  "hsl(262, 60%, 55%)",
  "hsl(195, 74%, 44%)",
]

export default function ReportsPage() {
  const { dbUser } = useAuth()
  const { currentUser, expenseRequests, departments, vendors, users, organization, formatAmount, currencyCode } = useData()

  const user = dbUser || currentUser
  const isRestricted = user?.role === "employee" || user?.role === "manager"

  const [range, setRange] = useState<string>("180d")
  const rangeOption = RANGE_OPTIONS.find((o) => o.value === range) ?? RANGE_OPTIONS[2]
  const filteredRequests = useMemo(
    () => filterByRange(expenseRequests, rangeOption.days),
    [expenseRequests, rangeOption.days],
  )

  const totals = useMemo(() => computeTotals(filteredRequests), [filteredRequests])
  const totalAmount = totals.submitted
  const approvedAmount = totals.approved
  const paidAmount = totals.paid
  const avgRequestAmount = totals.avg

  // Real monthly trend derived from request dates (no random data). Window
  // length now follows the selected range instead of a fixed 6 months.
  const monthlyData = useMemo(
    () => monthlyTrend(filteredRequests, rangeOption.months).map((p) => ({ month: p.label, ...p })),
    [filteredRequests, rangeOption.months],
  )

  const categoryBreakdown = useMemo(
    () =>
      spendByCategory(filteredRequests).map((c) => ({
        name: getCategoryLabel(c.category),
        count: c.count,
        amount: c.amount,
        pct: c.pct,
      })),
    [filteredRequests],
  )

  const deptData = useMemo(
    () =>
      spendByDepartment(filteredRequests, departments).map((d) => {
        const dept = departments.find((x) => x.id === d.departmentId)
        return { name: dept?.name ?? "Unknown", spend: d.spend, budget: d.budget, pct: d.pct }
      }),
    [filteredRequests, departments],
  )

  const vendorSpend = useMemo(
    () =>
      topVendors(filteredRequests, 8).map((v) => ({
        name: vendors.find((x) => x.id === v.vendorId)?.name ?? "Unknown vendor",
        amount: v.amount,
        count: v.count,
      })),
    [filteredRequests, vendors],
  )

  const statusBreakdown = useMemo(
    () =>
      countByStatus(filteredRequests).map((s) => ({
        name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
        value: s.count,
      })),
    [filteredRequests],
  )

  function handleExport(format: "csv" | "pdf") {
    const report = buildExpenseReport({
      requests: filteredRequests,
      departments,
      vendors,
      users,
      organizationName: organization?.name,
    })
    const stamp = new Date().toISOString().slice(0, 10)
    if (format === "csv") {
      downloadCSV(report.csv, `expense-report-${stamp}.csv`)
    } else {
      downloadHTMLReport(report.html, `expense-report-${stamp}`)
    }
  }

  if (isRestricted) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-4">
          <BarChart3 className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <h3 className="font-heading font-bold mb-1">Reports Access Restricted</h3>
        <p className="text-sm text-muted-foreground max-w-xs">Finance and admin roles can access detailed financial reports.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Financial analytics and spending insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-transparent font-semibold">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport("csv")}>
              <FileText className="w-4 h-4 mr-2" /> Download CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf")}>
              <FileText className="w-4 h-4 mr-2" /> Print / Save as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Submitted" value={formatAmount(totalAmount)} icon={FileText} />
        <StatCard title="Total Approved" value={formatAmount(approvedAmount)} icon={TrendingUp} />
        <StatCard title="Total Paid" value={formatAmount(paidAmount)} icon={DollarSign} />
        <StatCard title="Avg. Request" value={formatAmount(avgRequestAmount)} icon={BarChart3} />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="h-9 gap-0.5 bg-secondary/60 p-0.5">
          <TabsTrigger value="overview" className="text-xs font-semibold h-8 px-4">Overview</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs font-semibold h-8 px-4">Categories</TabsTrigger>
          <TabsTrigger value="departments" className="text-xs font-semibold h-8 px-4">Departments</TabsTrigger>
          <TabsTrigger value="vendors" className="text-xs font-semibold h-8 px-4">Vendors</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-5 flex flex-col gap-5">
          <div className="grid lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-base font-bold">Monthly Spending Trend</CardTitle>
                <CardDescription className="text-xs">Submitted vs approved vs paid — {rangeOption.label.toLowerCase()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="submitted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="approved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(162, 64%, 41%)" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="hsl(162, 64%, 41%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${getCurrencySymbol(currencyCode)}${v / 1000}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "13px", color: "hsl(var(--foreground))", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}
                        formatter={(value: number) => [formatAmount(value)]}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Area type="monotone" dataKey="submitted" stroke="hsl(221, 83%, 53%)" fill="url(#submitted)" strokeWidth={2} />
                      <Area type="monotone" dataKey="approved" stroke="hsl(162, 64%, 41%)" fill="url(#approved)" strokeWidth={2} />
                      <Line type="monotone" dataKey="paid" stroke="hsl(35, 92%, 52%)" strokeWidth={2} dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-base font-bold">Status Breakdown</CardTitle>
                <CardDescription className="text-xs">Distribution of all requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                        {statusBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "13px", color: "hsl(var(--foreground))" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                  {statusBreakdown.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-muted-foreground font-medium">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="mt-5 flex flex-col gap-5">
          <div className="grid lg:grid-cols-2 gap-5">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-base font-bold">Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryBreakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${getCurrencySymbol(currencyCode)}${v / 1000}k`} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "13px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [formatAmount(value), "Amount"]} />
                      <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                        {categoryBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-base font-bold">Category Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {categoryBreakdown.map((cat, i) => (
                    <div key={cat.name} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-sm font-medium">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-muted-foreground tabular-nums">{cat.count} requests</span>
                          <span className="font-heading font-bold tabular-nums">{formatAmount(cat.amount)}</span>
                        </div>
                      </div>
                      <Progress value={cat.pct} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Departments */}
        <TabsContent value="departments" className="mt-5 flex flex-col gap-5">
          <div className="grid lg:grid-cols-2 gap-5">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-base font-bold">Department Budget Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${getCurrencySymbol(currencyCode)}${v / 1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "13px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [formatAmount(value)]} />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="spend" name="Spent" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="budget" name="Budget" fill="hsl(var(--border))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-base font-bold">Budget Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-5">
                  {deptData.map((dept) => (
                    <div key={dept.name} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{dept.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{formatAmount(dept.spend)} / {formatAmount(dept.budget)}</span>
                      </div>
                      <Progress value={Math.min(dept.pct, 100)} className="h-2" />
                      <span className={cn("text-xs font-semibold", dept.pct >= 90 ? "text-red-600 dark:text-red-400" : dept.pct >= 75 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                        {dept.pct}% utilized
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vendors */}
        <TabsContent value="vendors" className="mt-5">
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base font-bold">Top Vendors by Spend</CardTitle>
              <CardDescription className="text-xs">Ranked by total expense amount</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/60">
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rank</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vendor</TableHead>
                      <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Requests</TableHead>
                      <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Spend</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorSpend.map((v, i) => (
                      <TableRow key={v.name} className="hover:bg-secondary/40 border-border/40 transition-colors">
                        <TableCell>
                          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary text-xs font-bold">{i + 1}</span>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{v.name}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{v.count}</TableCell>
                        <TableCell className="text-right font-heading font-bold text-sm tabular-nums">{formatAmount(v.amount)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={totalAmount > 0 ? (v.amount / totalAmount) * 100 : 0} className="h-1.5 w-16" />
                            <span className="text-xs text-muted-foreground tabular-nums">{totalAmount > 0 ? Math.round((v.amount / totalAmount) * 100) : 0}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
