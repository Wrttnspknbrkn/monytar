"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  AlertTriangle,
  Users,
  Building2,
  Plus,
  ArrowRight,
  CreditCard,
  TrendingUp,
} from "lucide-react"
import { useStore } from "@/lib/store"
import { formatCurrency, formatRelativeTime, formatDate } from "@/lib/utils"
import { StatCard } from "@/components/dashboard/stat-card"
import { RequestStatusBadge } from "@/components/requests/request-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

const CHART_COLORS = ["hsl(217, 91%, 60%)", "hsl(160, 60%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(270, 60%, 55%)"]

export default function DashboardPage() {
  const { currentUser, expenseRequests, departments, users, vendors, getDepartmentSpend, getPendingApprovals, budgetAlerts } =
    useStore()

  const role = currentUser.role

  // Employee stats
  const myRequests = useMemo(() => expenseRequests.filter((r) => r.employee_id === currentUser.id), [expenseRequests, currentUser])
  const myPending = myRequests.filter((r) => r.status === "pending").length
  const myApproved = myRequests.filter((r) => r.status === "approved" || r.status === "paid")
  const myRejected = myRequests.filter((r) => r.status === "rejected").length
  const myTotalApproved = myApproved.reduce((s, r) => s + r.amount, 0)

  // Manager/Finance/Admin stats
  const pendingApprovals = getPendingApprovals()
  const pendingTotal = pendingApprovals.reduce((s, r) => s + r.amount, 0)
  const allApproved = expenseRequests.filter((r) => r.status === "approved" || r.status === "paid")
  const totalApprovedAmount = allApproved.reduce((s, r) => s + r.amount, 0)
  const totalPaidAmount = expenseRequests.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0)
  const awaitingPayment = expenseRequests.filter((r) => r.status === "approved" && r.payment_status === "unpaid")

  // Category breakdown
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {}
    const source = role === "employee" ? myRequests : expenseRequests
    for (const r of source.filter((r) => r.status !== "draft" && r.status !== "cancelled")) {
      cats[r.category] = (cats[r.category] || 0) + r.amount
    }
    return Object.entries(cats).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round(value),
    }))
  }, [expenseRequests, myRequests, role])

  // Monthly trend (mock)
  const monthlyTrend = [
    { month: "Sep", amount: 12400 },
    { month: "Oct", amount: 15800 },
    { month: "Nov", amount: 13200 },
    { month: "Dec", amount: 18500 },
    { month: "Jan", amount: 16700 },
    { month: "Feb", amount: 14300 },
  ]

  // Department budget overview
  const deptBudgets = departments.map((d) => {
    const spend = getDepartmentSpend(d.id)
    return { ...d, spend, pct: d.budget_amount > 0 ? Math.round((spend / d.budget_amount) * 100) : 0 }
  })

  // Recent requests
  const recentRequests = (role === "employee" ? myRequests : expenseRequests)
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back, {currentUser.full_name.split(" ")[0]}. Here&apos;s your overview.
          </p>
        </div>
        {role === "employee" && (
          <Link href="/requests/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" /> New Request
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      {role === "employee" ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Pending" value={String(myPending)} icon={Clock} />
          <StatCard title="Approved Total" value={formatCurrency(myTotalApproved)} icon={CheckCircle2} trend={{ value: "+12%", positive: true }} />
          <StatCard title="Rejected" value={String(myRejected)} icon={XCircle} />
          <StatCard title="This Month" value={formatCurrency(myRequests.filter((r) => r.status !== "draft").reduce((s, r) => s + r.amount, 0))} icon={DollarSign} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending Approvals"
            value={String(pendingApprovals.length)}
            icon={Clock}
            trend={pendingApprovals.length > 0 ? { value: formatCurrency(pendingTotal), positive: false } : undefined}
          />
          <StatCard title="Total Approved" value={formatCurrency(totalApprovedAmount)} icon={CheckCircle2} trend={{ value: "+8.5%", positive: true }} />
          <StatCard title="Total Paid" value={formatCurrency(totalPaidAmount)} icon={CreditCard} />
          {role === "admin" ? (
            <StatCard title="Active Users" value={String(users.filter((u) => u.status === "active").length)} icon={Users} />
          ) : role === "finance" ? (
            <StatCard title="Awaiting Payment" value={String(awaitingPayment.length)} icon={DollarSign} />
          ) : (
            <StatCard title="Team Members" value={String(users.filter((u) => u.department_id === currentUser.department_id).length)} icon={Users} />
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Spending Trend</CardTitle>
            <CardDescription>Monthly expense totals over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Amount"]}
                  />
                  <Line type="monotone" dataKey="amount" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Category</CardTitle>
            <CardDescription>Spending breakdown by expense type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Amount"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Requests</CardTitle>
              <CardDescription>Latest expense submissions</CardDescription>
            </div>
            <Link href="/requests">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {recentRequests.map((req) => (
                <Link key={req.id} href={`/requests/${req.id}`}>
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{req.purpose}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.request_number} &middot; {formatRelativeTime(req.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold">{formatCurrency(req.amount)}</span>
                      <RequestStatusBadge status={req.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Budget Overview / Pending Approvals */}
        {role !== "employee" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Department Budgets</CardTitle>
              <CardDescription>Current budget utilization across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-5">
                {deptBudgets.map((dept) => (
                  <div key={dept.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{dept.name}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(dept.spend)} / {formatCurrency(dept.budget_amount)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(dept.pct, 100)}
                      className="h-2"
                    />
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${dept.pct >= 90 ? "text-red-600 dark:text-red-400" : dept.pct >= 75 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {dept.pct}% used
                      </span>
                      {dept.pct >= 75 && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          {dept.pct >= 90 ? "Critical" : "Warning"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Budget Alerts */}
              {budgetAlerts.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium mb-3">Active Alerts</h4>
                  <div className="flex flex-col gap-2">
                    {budgetAlerts.map((alert) => {
                      const dept = departments.find((d) => d.id === alert.department_id)
                      return (
                        <div key={alert.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 text-sm">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="text-amber-800 dark:text-amber-300">
                            {dept?.name} at {alert.threshold_percentage}% of budget
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Vendors</CardTitle>
              <CardDescription>Your most used vendors this period</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const vendorSpend: Record<string, { name: string; amount: number }> = {}
                for (const r of myRequests.filter((r) => r.vendor_id && r.status !== "draft" && r.status !== "cancelled")) {
                  const v = vendors.find((v) => v.id === r.vendor_id)
                  if (v) {
                    if (!vendorSpend[v.id]) vendorSpend[v.id] = { name: v.name, amount: 0 }
                    vendorSpend[v.id].amount += r.amount
                  }
                }
                const data = Object.values(vendorSpend)
                  .sort((a, b) => b.amount - a.amount)
                  .slice(0, 5)
                return (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                          formatter={(value: number) => [formatCurrency(value), "Spent"]}
                        />
                        <Bar dataKey="amount" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pending Approvals for managers */}
      {role !== "employee" && pendingApprovals.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Pending Approvals</CardTitle>
              <CardDescription>{pendingApprovals.length} requests awaiting your review</CardDescription>
            </div>
            <Link href="/approvals">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {pendingApprovals.slice(0, 5).map((req) => {
                const emp = users.find((u) => u.id === req.employee_id)
                return (
                  <Link key={req.id} href={`/requests/${req.id}`}>
                    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{req.purpose}</p>
                        <p className="text-xs text-muted-foreground">
                          by {emp?.full_name || "Unknown"} &middot; {formatRelativeTime(req.submitted_at || req.created_at)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(req.amount)}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
