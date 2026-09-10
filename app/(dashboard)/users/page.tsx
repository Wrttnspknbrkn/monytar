"use client"

import { useMemo, useState } from "react"
import { Plus, Search, Users, Shield, Mail } from "lucide-react"
import { useData, useAuth } from "@/lib/providers"
import { generateId, getRoleLabel, getInitials, formatDate, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
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
import type { User, UserRole } from "@/lib/types"

const roleColors: Record<UserRole, string> = {
  employee: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  manager: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  finance: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  admin: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
}

export default function UsersPage() {
  const { dbUser } = useAuth()
  const { currentUser, users, departments, addUser, updateUser, isDemo, organization } = useData()
  const user = dbUser || currentUser
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [form, setForm] = useState({ full_name: "", email: "", role: "employee" as UserRole, department_id: "" })
  // Deactivating revokes access — confirm before firing, unlike reactivating.
  const [pendingDeactivation, setPendingDeactivation] = useState<User | null>(null)

  const isAdmin = user?.role === "admin"

  const filtered = useMemo(() => {
    let result = users
    if (roleFilter !== "all") result = result.filter((u) => u.role === roleFilter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    }
    return result
  }, [users, roleFilter, search])

  async function handleAdd() {
    if (!form.full_name || !form.email) { toast.error("Name and email are required"); return }

    if (isDemo) {
      const now = new Date().toISOString()
      addUser({
        id: generateId(), organization_id: organization?.id || "demo-org", full_name: form.full_name, email: form.email,
        role: form.role, department_id: form.department_id || undefined, status: "active", created_at: now, updated_at: now,
      })
      toast.success("User added")
      setForm({ full_name: "", email: "", role: "employee", department_id: "" })
      setDialogOpen(false)
      return
    }

    // Real orgs can't add a login-capable user directly from the client —
    // this sends an email invitation instead (accepted via /signup?invitation=...).
    setInviting(true)
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          role: form.role,
          department_id: form.department_id || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Failed to send invitation")
        return
      }
      // The API honestly reports whether the email actually sent (it no-ops
      // without RESEND_API_KEY configured) — surface that instead of always
      // claiming success, and hand the admin the link to share manually.
      if (data.emailSent) {
        toast.success(`Invitation sent to ${form.email}`)
      } else {
        const reason = data.emailDomainNotVerified
          ? "your sending domain isn't verified in Resend yet"
          : "the email couldn't be sent"
        try {
          await navigator.clipboard.writeText(data.inviteUrl)
          toast.warning(`Invitation created, but ${reason}. Link copied — share it with ${form.email} directly.`, { duration: 8000 })
        } catch {
          toast.warning(`Invitation created, but ${reason}. Share this link with ${form.email}: ${data.inviteUrl}`, { duration: 10000 })
        }
      }
      setForm({ full_name: "", email: "", role: "employee", department_id: "" })
      setDialogOpen(false)
    } catch (err) {
      console.error("[Users] invitation failed:", err)
      toast.error("Failed to send invitation. Please try again.")
    } finally {
      setInviting(false)
    }
  }

  async function handleStatusChange(userId: string, status: "active" | "inactive") {
    try {
      await updateUser(userId, { status })
      toast.success(status === "active" ? "User reactivated" : "User deactivated")
    } catch (err) {
      console.error("[Users] status update failed:", err)
      toast.error("Failed to update user status. Please try again.")
    }
  }

  async function confirmDeactivation() {
    if (!pendingDeactivation) return
    await handleStatusChange(pendingDeactivation.id, "inactive")
    setPendingDeactivation(null)
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-4"><Shield className="w-7 h-7 text-muted-foreground/40" /></div>
        <h3 className="font-heading font-bold mb-1">Admin Only</h3>
        <p className="text-sm text-muted-foreground">User management requires admin privileges.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{users.length} team members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm shadow-primary/25 font-semibold"><Plus className="w-4 h-4 mr-2" /> Add User</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading">Add Team Member</DialogTitle>
              <DialogDescription>Invite a new user to your organization.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2"><Label className="text-[13px] font-medium">Full Name *</Label><Input placeholder="John Doe" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label className="text-[13px] font-medium">Email *</Label><Input type="email" placeholder="john@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2"><Label className="text-[13px] font-medium">Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2"><Label className="text-[13px] font-medium">Department</Label>
                  <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{departments.filter((d) => d.is_active !== false).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={handleAdd} disabled={inviting} className="font-semibold shadow-sm shadow-primary/20">{inviting ? "Sending..." : isDemo ? "Add User" : "Send Invitation"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">User</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Role</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Department</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Joined</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => {
                  const dept = departments.find((d) => d.id === user.department_id)
                  return (
                    <TableRow key={user.id} className="hover:bg-secondary/40 border-border/40 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">{getInitials(user.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider", roleColors[user.role])}>
                          {getRoleLabel(user.role)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{dept?.name || "-"}</TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center gap-1 text-xs font-medium",
                          user.status === "active" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", user.status === "active" ? "bg-emerald-500" : "bg-gray-400")} />
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <Select
                          value={user.status}
                          onValueChange={(v) => {
                            if (v === "inactive") setPendingDeactivation(user)
                            else handleStatusChange(user.id, "active")
                          }}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingDeactivation} onOpenChange={(open) => !open && setPendingDeactivation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {pendingDeactivation?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will immediately lose access to this organization. You can reactivate them at any time from this page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
