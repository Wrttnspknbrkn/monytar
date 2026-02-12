"use client"

import { useState } from "react"
import { Plus, Building2, Users, AlertTriangle } from "lucide-react"
import { useStore } from "@/lib/store"
import { formatCurrency, generateId, cn, getInitials } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { BudgetPeriod } from "@/lib/types"

export default function DepartmentsPage() {
  const { currentUser, departments, users, getDepartmentSpend, addDepartment, updateDepartment } = useStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ name: "", budget_amount: "", budget_period: "monthly" as BudgetPeriod, description: "", manager_id: "" })

  const canEdit = currentUser.role === "manager" || currentUser.role === "finance" || currentUser.role === "admin"
  const managers = users.filter((u) => u.role === "manager" || u.role === "admin")

  function handleAdd() {
    if (!form.name.trim() || !form.budget_amount) { toast.error("Name and budget are required"); return }
    const now = new Date().toISOString()
    addDepartment({
      id: generateId(), organization_id: "org-1", name: form.name, description: form.description || undefined,
      manager_id: form.manager_id || undefined, budget_amount: Number.parseFloat(form.budget_amount), budget_period: form.budget_period,
      created_at: now, updated_at: now,
    })
    toast.success("Department created")
    setForm({ name: "", budget_amount: "", budget_period: "monthly", description: "", manager_id: "" })
    setDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Departments</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{departments.length} departments with budget tracking</p>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-sm shadow-primary/25 font-semibold"><Plus className="w-4 h-4 mr-2" /> Add Department</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-heading">New Department</DialogTitle>
                <DialogDescription>Create a new department with budget allocation.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2"><Label className="text-[13px] font-medium">Name *</Label><Input placeholder="Department name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="flex flex-col gap-2"><Label className="text-[13px] font-medium">Description</Label><Input placeholder="Brief description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2"><Label className="text-[13px] font-medium">Budget *</Label><Input type="number" placeholder="50000" value={form.budget_amount} onChange={(e) => setForm({ ...form, budget_amount: e.target.value })} /></div>
                  <div className="flex flex-col gap-2"><Label className="text-[13px] font-medium">Period</Label>
                    <Select value={form.budget_period} onValueChange={(v) => setForm({ ...form, budget_period: v as BudgetPeriod })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-2"><Label className="text-[13px] font-medium">Manager</Label>
                  <Select value={form.manager_id} onValueChange={(v) => setForm({ ...form, manager_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                    <SelectContent>{managers.map((m) => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={handleAdd} className="font-semibold shadow-sm shadow-primary/20">Create Department</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => {
          const spend = getDepartmentSpend(dept.id)
          const pct = dept.budget_amount > 0 ? Math.round((spend / dept.budget_amount) * 100) : 0
          const manager = dept.manager_id ? users.find((u) => u.id === dept.manager_id) : undefined
          const memberCount = users.filter((u) => u.department_id === dept.id).length
          return (
            <Card key={dept.id} className="border-border/60 hover:border-primary/20 transition-all duration-200 hover:shadow-md hover:shadow-foreground/[0.03] hover:-translate-y-0.5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-sm">{dept.name}</h3>
                    {dept.description && <p className="text-xs text-muted-foreground truncate">{dept.description}</p>}
                  </div>
                </div>

                {/* Budget progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium">Budget Utilization</span>
                    <span className="text-muted-foreground tabular-nums">{formatCurrency(spend)} / {formatCurrency(dept.budget_amount)}</span>
                  </div>
                  <Progress value={Math.min(pct, 100)} className="h-2" />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className={cn("text-xs font-semibold", pct >= 90 ? "text-red-600 dark:text-red-400" : pct >= 75 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                      {pct}% used
                    </span>
                    {pct >= 75 && <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium"><AlertTriangle className="w-3 h-3" />{pct >= 90 ? "Critical" : "Warning"}</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  {manager ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{getInitials(manager.full_name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{manager.full_name}</span>
                    </div>
                  ) : <span className="text-xs text-muted-foreground">No manager</span>}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{memberCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
