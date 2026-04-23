"use client"

import { useMemo } from "react"
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  FileText,
  Download,
  ArrowUpRight,
  PieChart as PieChartIcon,
} from "lucide-react"
import { useData, useAuth } from "@/lib/providers"
import { formatCurrency, cn, getCategoryLabel } from "@/lib/utils"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const { currentUser, expenseRequests, departments, vendors, users, getDepartmentSpend } = useData()

  const user = dbUser || currentUser
  const isRestricted = user?.role === "employee" || user?.role === "manager"

  const totalExpenses = expenseRequests.filter((r) => r.status !== "draft" && r.status !== "cancelled")
  const totalAmount = totalExpenses.reduce((s, r) => s + r.amount, 0)
  const approvedAmount = expenseRequests
    .filter((r) => r.status === "approved" || r.status === "paid")
    .reduce((s, r) => s + r.amount, 0)
  const paidAmount = expenseRequests.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0)
  const avgRequestAmount = totalExpenses.length > 0 ? totalAmount / totalExpenses.length : 0

  const monthlyData = useMemo(() => {
    const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"]
    return months.map((month, i) => ({
      month,
      submitted: Math.round(12000 + Math.random() * 8000),
      approved: Math.round(10000 + Math.random() * 6000),
      paid: Math.round(8000 + Math.random() * 5000),
    }))
  }, [])

  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, { count: number; amount: number }> = {}
    for (const r of totalExpenses) {
      if (!cats[r.category]) cats[r.category] = { count: 0, amount: 0 }
      cats[r.category].count++
      cats[r.category].amount += r.amount
    }
    return Object.entries(cats)
      .map(([name, data]) => ({
        name: getCategoryLabel(name as Parameters<typeof getCategoryLabel>[0]),
        ...data,
        pct: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [totalExpenses, totalAmount])

  const deptData = departments.map((d) => {
    const spend = getDepartmentSpend(d.id)
    return {
      name: d.name,
      spend,
      budget: d.budget_amount,
      pct: d.budget_amount > 0 ? Math.round((spend / d.budget_amount) * 100) : 0,
    }
  })

  const vendorSpend = useMemo(() => {
    const vs: Record<string, { name: string; amount: number; count: number }> = {}
    for (const r of totalExpenses.filter((r) => r.vendor_id)) {
      const v = vendors.find((v) => v.id === r.vendor_id)
      if (v) {
        if (!vs[v.id]) vs[v.id] = { name: v.name, amount: 0, count: 0 }
        vs[v.id].amount += r.amount
        vs[v.id].count++
      }
    }
    return Object.values(vs).sort((a, b) => b.amount - a.amount).slice(0, 8)
  }, [totalExpenses, vendors])

  const statusBreakdown = useMemo(() => {
    const statuses: Record<string, number> = {}
    for (const r of expenseRequests) {
      statuses[r.status] = (statuses[r.status] || 0) + 1
    }
    return Object.entries(statuses).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))
  }, [expenseRequests])

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
        <Button variant="outline" className="bg-transparent font-semibold">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Submitted" value={formatCurrency(totalAmount)} icon={FileText} trend={{ value: "+14%", positive: true }} />
        <StatCard title="Total Approved" value={formatCurrency(approvedAmount)} icon={TrendingUp} trend={{ value: "+8.5%", positive: true }} />
        <StatCard title="Total Paid" value={formatCurrency(paidAmount)} icon={DollarSign} />
        <StatCard title="Avg. Request" value={formatCurrency(avgRequestAmount)} icon={BarChart3} />
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
                <CardDescription className="text-xs">Submitted vs approved vs paid over the last 6 months</CardDescription>
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
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "13px", color: "hsl(var(--foreground))", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}
                        formatter={(value: number) => [formatCurrency(value)]}
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
                      <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "13px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [formatCurrency(value), "Amount"]} />
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
                          <span className="font-heading font-bold tabular-nums">{formatCurrency(cat.amount)}</span>
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
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "13px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [formatCurrency(value)]} />
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
                        <span className="text-xs text-muted-foreground tabular-nums">{formatCurrency(dept.spend)} / {formatCurrency(dept.budget)}</span>
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
                        <TableCell className="text-right font-heading font-bold text-sm tabular-nums">{formatCurrency(v.amount)}</TableCell>
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
