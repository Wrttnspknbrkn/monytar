"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Building2, Users, AlertTriangle, Archive, ArchiveRestore, Pencil, Loader2, AlertCircle, UserPlus, UserMinus, Shield } from "lucide-react"
import { useData, useAuth } from "@/lib/providers"
import { formatCurrency, generateId, cn, getInitials, getRoleLabel } from "@/lib/utils"
import { computeBudgetStatus } from "@/lib/budgets/calc"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/empty-state"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/errors"
import type { BudgetPeriod, Department, User } from "@/lib/types"

const NO_MANAGER = "none"

interface DeptForm {
  name: string
  description: string
  budget_amount: string
  budget_period: BudgetPeriod
  manager_id: string
}

const EMPTY_FORM: DeptForm = { name: "", description: "", budget_amount: "", budget_period: "monthly", manager_id: NO_MANAGER }

function errorText(err: unknown, fallback: string): string {
  return getErrorMessage(err, fallback)
}

export default function DepartmentsPage() {
  const { dbUser } = useAuth()
  const { currentUser, departments, users, getDepartmentSpend, addDepartment, updateDepartment, updateUser, organization, orgSettings, currencyCode } = useData()
  // Single source of truth for the org's currency (see DataProvider's
  // currencyCode): `organizations.currency` is a legacy column the Settings
  // currency picker never writes to (it only updates
  // organization_settings.default_currency) and permanently defaults to
  // 'USD' in the database, so checking it before orgSettings here — as this
  // page previously did — meant changing the org's currency never took
  // effect on this page: department budgets kept showing USD.
  const currency = currencyCode
  const user = dbUser || currentUser

  // Matches the "Admins can manage departments" RLS policy (admin + finance).
  // Managers can view departments but the database rejects their writes, so
  // they must not be offered controls that can only fail.
  const canEdit = user?.role === "admin" || user?.role === "finance"
  // Reassigning people edits user rows, which only admins may do.
  const canAssignUsers = user?.role === "admin"

  const [showArchived, setShowArchived] = useState(false)

  // Create / edit dialog (editing === null → creating)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [form, setForm] = useState<DeptForm>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<Record<"name" | "budget" | "form", string>>>({})
  const [saving, setSaving] = useState(false)

  // Archive confirmation
  const [archiveTarget, setArchiveTarget] = useState<{ dept: Department; archive: boolean } | null>(null)
  const [archiving, setArchiving] = useState(false)

  // Members dialog
  const [membersFor, setMembersFor] = useState<string | null>(null)
  const [addUserId, setAddUserId] = useState<string>("")
  const [assigningId, setAssigningId] = useState<string | null>(null)

  const managers = users.filter((u) => (u.role === "manager" || u.role === "admin") && u.status === "active")
  const archivedCount = useMemo(() => departments.filter((d) => d.is_active === false).length, [departments])
  const visibleDepartments = showArchived ? departments : departments.filter((d) => d.is_active !== false)
  const membersDept = membersFor ? departments.find((d) => d.id === membersFor) : undefined
  const members = membersDept ? users.filter((u) => u.department_id === membersDept.id) : []
  const assignable = membersDept ? users.filter((u) => u.department_id !== membersDept.id && u.status === "active") : []

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setFormOpen(true)
  }

  function openEdit(dept: Department) {
    setEditing(dept)
    setForm({
      name: dept.name,
      description: dept.description || "",
      budget_amount: String(dept.budget_amount ?? ""),
      budget_period: dept.budget_period,
      manager_id: dept.manager_id || NO_MANAGER,
    })
    setFormErrors({})
    setFormOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return

    const errors: typeof formErrors = {}
    const name = form.name.trim()
    if (!name) errors.name = "Give the department a name."
    else if (
      departments.some((d) => d.id !== editing?.id && d.name.trim().toLowerCase() === name.toLowerCase())
    ) {
      errors.name = "A department with this name already exists."
    }
    const budget = Number.parseFloat(form.budget_amount)
    if (form.budget_amount.trim() === "") errors.budget = "Enter a budget (use 0 to track spend without a limit)."
    else if (!Number.isFinite(budget) || budget < 0) errors.budget = "Budget must be a number that's zero or more."
    if (errors.name || errors.budget) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})

    setSaving(true)
    const now = new Date().toISOString()
    const managerId = form.manager_id === NO_MANAGER ? null : form.manager_id
    try {
      if (editing) {
        // Only the fields on this form are sent — never the id, org, or anything
        // else — so editing a department can't touch unrelated data, and users
        // assigned to it keep their assignment (they reference it by id).
        await updateDepartment(editing.id, {
          name,
          description: form.description.trim() || null,
          budget_amount: budget,
          budget_period: form.budget_period,
          manager_id: managerId,
        } as unknown as Partial<Department>)
        toast.success(`${name} was updated.`)
      } else {
        await addDepartment({
          id: generateId(),
          organization_id: organization?.id || user?.organization_id || "",
          name,
          description: form.description.trim() || undefined,
          manager_id: managerId || undefined,
          budget_amount: budget,
          budget_period: form.budget_period,
          created_at: now,
          updated_at: now,
        })
        toast.success(`${name} was created.`)
      }
      setFormOpen(false)
    } catch (err) {
      console.error("[Departments] save failed:", err)
      setFormErrors({ form: errorText(err, "Couldn't save the department. Please try again.") })
    } finally {
      setSaving(false)
    }
  }

  async function confirmArchive() {
    if (!archiveTarget || archiving) return
    const { dept, archive } = archiveTarget
    setArchiving(true)
    try {
      await updateDepartment(dept.id, { is_active: !archive })
      toast.success(archive ? `${dept.name} was archived.` : `${dept.name} was restored.`)
      setArchiveTarget(null)
    } catch (err) {
      console.error("[Departments] archive toggle failed:", err)
      toast.error(errorText(err, "Couldn't update the department. Please try again."))
    } finally {
      setArchiving(false)
    }
  }

  async function assign(target: User, departmentId: string | null, deptName: string) {
    setAssigningId(target.id)
    try {
      await updateUser(target.id, { department_id: departmentId } as unknown as Partial<User>)
      toast.success(departmentId ? `${target.full_name} moved to ${deptName}.` : `${target.full_name} removed from ${deptName}.`)
      if (departmentId) setAddUserId("")
    } catch (err) {
      console.error("[Departments] assignment failed:", err)
      toast.error(errorText(err, "Couldn't update that user. Please try again."))
    } finally {
      setAssigningId(null)
    }
  }

  if (!user) return null

  if (user.role === "employee") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-4">
          <Shield className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <h1 className="font-heading font-bold mb-1">Departments aren&apos;t available for your role</h1>
        <p className="text-sm text-muted-foreground max-w-sm mb-5">Departments are managed by managers, finance and admins. You&apos;re signed in as {getRoleLabel(user.role)}.</p>
        <Button asChild variant="outline" className="font-semibold"><Link href="/dashboard">Back to dashboard</Link></Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Departments</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {visibleDepartments.length} {visibleDepartments.length === 1 ? "department" : "departments"} with budget tracking
            {!canEdit && " · view only for your role"}
          </p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4">
          {archivedCount > 0 && (
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
              <Switch checked={showArchived} onCheckedChange={setShowArchived} />
              Show archived ({archivedCount})
            </label>
          )}
          {canEdit && (
            <Button className="shadow-sm shadow-primary/25 font-semibold" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" /> Add department
            </Button>
          )}
        </div>
      </div>

      {visibleDepartments.length === 0 ? (
        <Card className="border-border/60">
          <CardContent>
            <EmptyState
              icon={Building2}
              title="No departments yet"
              description={canEdit ? "Create a department to group people and track their spending against a budget." : "An admin or finance user hasn't created any departments yet."}
              actionLabel={canEdit ? "Add department" : undefined}
              onAction={openCreate}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {visibleDepartments.map((dept) => {
            const archived = dept.is_active === false
            const spend = getDepartmentSpend(dept.id)
            const budgetStatus = computeBudgetStatus(spend, dept.budget_amount, orgSettings?.budget_alert_thresholds)
            const pct = budgetStatus.percentage
            const manager = dept.manager_id ? users.find((u) => u.id === dept.manager_id) : undefined
            const memberCount = users.filter((u) => u.department_id === dept.id).length
            return (
              <Card key={dept.id} className={cn("min-w-0 border-border/60 hover:border-primary/20 transition-all duration-200 hover:shadow-md hover:shadow-foreground/[0.03]", archived && "opacity-70")}>
                <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary shrink-0">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-heading font-bold text-sm break-words">{dept.name}</h2>
                        {archived && (
                          <span className="inline-flex px-1.5 py-0.5 rounded-md border text-[9px] font-semibold uppercase tracking-wider bg-secondary text-muted-foreground border-border">Archived</span>
                        )}
                      </div>
                      {dept.description && <p className="text-xs text-muted-foreground line-clamp-2">{dept.description}</p>}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                      <span className="font-medium shrink-0">Budget ({dept.budget_period})</span>
                      <span className="text-muted-foreground tabular-nums truncate">{formatCurrency(spend, currency)} / {formatCurrency(dept.budget_amount, currency)}</span>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="h-2" aria-label={`${dept.name} budget used`} />
                    <div className="flex items-center justify-between mt-1.5">
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          budgetStatus.level === "exceeded" || budgetStatus.level === "critical"
                            ? "text-red-600 dark:text-red-400"
                            : budgetStatus.level === "warning"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {pct}% used
                      </span>
                      {budgetStatus.level !== "none" && (
                        <span className={cn("flex items-center gap-1 text-xs font-medium", budgetStatus.level === "warning" ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>
                          <AlertTriangle className="w-3 h-3" />
                          {budgetStatus.level === "exceeded" ? "Over budget" : budgetStatus.level === "critical" ? "Critical" : "Warning"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/50">
                    {manager ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="w-6 h-6 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{getInitials(manager.full_name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium truncate">{manager.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No manager assigned</span>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Users className="w-3 h-3" />
                      <span>{memberCount} {memberCount === 1 ? "member" : "members"}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 gap-1.5 bg-transparent flex-1 sm:flex-none" onClick={() => setMembersFor(dept.id)}>
                      <Users className="w-3.5 h-3.5" /> Members
                    </Button>
                    {canEdit && (
                      <>
                        <Button variant="outline" size="sm" className="h-9 gap-1.5 bg-transparent flex-1 sm:flex-none" onClick={() => openEdit(dept)} aria-label={`Edit ${dept.name}`}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 gap-1.5 text-muted-foreground"
                          onClick={() => setArchiveTarget({ dept, archive: !archived })}
                          aria-label={archived ? `Restore ${dept.name}` : `Archive ${dept.name}`}
                        >
                          {archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                          {archived ? "Restore" : "Archive"}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create / edit */}
      <Dialog open={formOpen} onOpenChange={(open) => !saving && setFormOpen(open)}>
        <DialogContent className="rounded-2xl">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="font-heading">{editing ? `Edit ${editing.name}` : "New department"}</DialogTitle>
              <DialogDescription>
                {editing ? "Changes apply immediately. People assigned to this department stay assigned." : "Create a department and set the budget it's tracked against."} Fields marked <span className="text-destructive">*</span> are required.
              </DialogDescription>
            </DialogHeader>

            {formErrors.form && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 px-3 py-2.5 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{formErrors.form}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="dept-name" className="text-[13px] font-medium">Name <span className="text-destructive">*</span></Label>
              <Input
                id="dept-name"
                autoFocus
                placeholder="e.g. Engineering"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? "dept-name-error" : undefined}
                className="h-10"
              />
              {formErrors.name && <p id="dept-name-error" className="text-xs text-destructive">{formErrors.name}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="dept-description" className="text-[13px] font-medium">Description</Label>
              <Input id="dept-description" placeholder="What this team does (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-10" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="dept-budget" className="text-[13px] font-medium">Budget ({currency}) <span className="text-destructive">*</span></Label>
                <Input
                  id="dept-budget"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  placeholder="50000"
                  value={form.budget_amount}
                  onChange={(e) => setForm({ ...form, budget_amount: e.target.value })}
                  aria-invalid={!!formErrors.budget}
                  aria-describedby={formErrors.budget ? "dept-budget-error" : undefined}
                  className="h-10"
                />
                {formErrors.budget && <p id="dept-budget-error" className="text-xs text-destructive">{formErrors.budget}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dept-period" className="text-[13px] font-medium">Budget period</Label>
                <Select value={form.budget_period} onValueChange={(v) => setForm({ ...form, budget_period: v as BudgetPeriod })}>
                  <SelectTrigger id="dept-period" className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="dept-manager" className="text-[13px] font-medium">Manager</Label>
              <Select value={form.manager_id} onValueChange={(v) => setForm({ ...form, manager_id: v })}>
                <SelectTrigger id="dept-manager" className="h-10"><SelectValue placeholder="No manager" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_MANAGER}>No manager</SelectItem>
                  {managers.map((m) => <SelectItem key={m.id} value={m.id}>{m.full_name} ({getRoleLabel(m.role)})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving} className="font-semibold shadow-sm shadow-primary/20">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : editing ? "Save changes" : "Create department"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Members */}
      <Dialog open={!!membersDept} onOpenChange={(open) => !open && setMembersFor(null)}>
        <DialogContent className="rounded-2xl">
          {membersDept && (
            <div className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle className="font-heading">{membersDept.name} — members</DialogTitle>
                <DialogDescription>
                  {canAssignUsers ? "Add people to this department or remove them. Moving someone here takes them out of their current department." : "People assigned to this department. Only admins can change assignments."}
                </DialogDescription>
              </DialogHeader>

              {canAssignUsers && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={addUserId} onValueChange={setAddUserId} disabled={assignable.length === 0}>
                    <SelectTrigger aria-label="Choose a person to add" className="h-10 flex-1">
                      <SelectValue placeholder={assignable.length === 0 ? "Everyone is already here" : "Choose a person to add…"} />
                    </SelectTrigger>
                    <SelectContent>
                      {assignable.map((u) => {
                        const current = u.department_id ? departments.find((d) => d.id === u.department_id)?.name : undefined
                        return <SelectItem key={u.id} value={u.id}>{u.full_name}{current ? ` — in ${current}` : " — no department"}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    className="h-10 gap-1.5 font-semibold"
                    disabled={!addUserId || !!assigningId}
                    onClick={() => {
                      const target = users.find((u) => u.id === addUserId)
                      if (target) void assign(target, membersDept.id, membersDept.name)
                    }}
                  >
                    {assigningId === addUserId ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Add
                  </Button>
                </div>
              )}

              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">No one is assigned to this department yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border/60 border rounded-lg max-h-72 overflow-y-auto">
                  {members.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 p-3">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">{getInitials(m.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{m.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{getRoleLabel(m.role)} · {m.email}</p>
                      </div>
                      {canAssignUsers && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 gap-1.5 text-muted-foreground shrink-0"
                          disabled={assigningId === m.id}
                          onClick={() => void assign(m, null, membersDept.name)}
                          aria-label={`Remove ${m.full_name} from ${membersDept.name}`}
                        >
                          {assigningId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />} Remove
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMembersFor(null)}>Done</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Archive / restore confirmation */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && !archiving && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{archiveTarget?.archive ? `Archive ${archiveTarget.dept.name}?` : `Restore ${archiveTarget?.dept.name}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget?.archive
                ? "It stays on past requests and reports, but won't be selectable for new ones. People assigned to it keep their assignment until you move them."
                : "It will be available again for new requests and assignments."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={archiving}
              onClick={(e) => {
                e.preventDefault()
                void confirmArchive()
              }}
            >
              {archiving ? "Working…" : archiveTarget?.archive ? "Archive" : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
