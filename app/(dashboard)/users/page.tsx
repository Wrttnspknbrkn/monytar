"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Plus, Search, Users as UsersIcon, Shield, Mail, Pencil, Copy, Clock, UserX, UserCheck, X, Loader2, AlertCircle } from "lucide-react"
import { useData, useAuth } from "@/lib/providers"
import { getRoleLabel, getInitials, formatDate, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/empty-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
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
import { useInitialSearchQuery } from "@/lib/hooks/use-url-query"
import type { User, UserRole } from "@/lib/types"

const roleColors: Record<UserRole, string> = {
  employee: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  manager: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  finance: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  admin: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
}

const ROLES: UserRole[] = ["employee", "manager", "finance", "admin"]

// What each role can actually do, matching the approval engine and RLS rules,
// so admins pick a role knowingly instead of guessing from a single word.
const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  employee: "Submits expense requests and tracks their own.",
  manager: "Approves requests from their own department.",
  finance: "Approves any request, processes payments, and manages categories.",
  admin: "Full access, including users, departments and settings.",
}

const NO_DEPARTMENT = "none"

interface InvitationRow {
  id: string
  email: string
  role: UserRole
  department_id: string | null
  status: "pending" | "accepted" | "expired" | "revoked"
  token: string
  expires_at: string
  created_at: string
  invited_by_user?: { full_name: string } | null
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

async function fetchInvitations(url: string): Promise<InvitationRow[]> {
  const res = await fetch(url)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || "Couldn't load invitations")
  return body.invitations ?? []
}

function errorText(err: unknown, fallback: string): string {
  return getErrorMessage(err, fallback)
}

export default function UsersPage() {
  const { dbUser } = useAuth()
  const { currentUser, users, departments, updateUser, isDemo, addUser, organization } = useData()
  const user = dbUser || currentUser
  const isAdmin = user?.role === "admin"

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  useInitialSearchQuery(setSearch)

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteEmailError, setInviteEmailError] = useState<string | null>(null)
  const [inviteForm, setInviteForm] = useState({ email: "", role: "employee" as UserRole, department_id: NO_DEPARTMENT })

  // Edit dialog
  const [editing, setEditing] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ role: "employee" as UserRole, department_id: NO_DEPARTMENT })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Confirmations
  const [statusTarget, setStatusTarget] = useState<{ user: User; next: "active" | "inactive" } | null>(null)
  const [changingStatus, setChangingStatus] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<InvitationRow | null>(null)
  const [revoking, setRevoking] = useState(false)

  const {
    data: invitations,
    error: invitationsError,
    isLoading: invitationsLoading,
    mutate: refreshInvitations,
  } = useSWR<InvitationRow[]>(isAdmin && !isDemo ? "/api/invitations" : null, fetchInvitations)

  const pendingInvites = useMemo(
    () => (invitations ?? []).filter((i) => i.status === "pending"),
    [invitations],
  )

  const activeDepartments = useMemo(() => departments.filter((d) => d.is_active !== false), [departments])
  const departmentName = (id?: string | null) => (id ? departments.find((d) => d.id === id)?.name : undefined)

  const activeAdminCount = users.filter((u) => u.role === "admin" && u.status === "active").length

  const filtered = useMemo(() => {
    let result = users
    if (roleFilter !== "all") result = result.filter((u) => u.role === roleFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    }
    return result
  }, [users, roleFilter, search])

  const activeCount = users.filter((u) => u.status === "active").length

  function openInvite() {
    setInviteForm({ email: "", role: "employee", department_id: NO_DEPARTMENT })
    setInviteError(null)
    setInviteEmailError(null)
    setInviteOpen(true)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (inviting) return
    setInviteError(null)

    const email = inviteForm.email.trim().toLowerCase()
    if (!email) {
      setInviteEmailError("Enter the person's email address.")
      return
    }
    if (!EMAIL_PATTERN.test(email)) {
      setInviteEmailError("That doesn't look like a valid email address.")
      return
    }
    setInviteEmailError(null)

    const departmentId = inviteForm.department_id === NO_DEPARTMENT ? undefined : inviteForm.department_id

    if (isDemo) {
      const now = new Date().toISOString()
      addUser({
        id: crypto.randomUUID(),
        organization_id: organization?.id || "demo-org",
        full_name: email.split("@")[0],
        email,
        role: inviteForm.role,
        department_id: departmentId,
        status: "active",
        created_at: now,
        updated_at: now,
      })
      toast.success(`${email} added (demo)`)
      setInviteOpen(false)
      return
    }

    // Real orgs can't create a login-capable user from the client — this
    // sends an email invitation; the person sets their own name and password
    // when they accept it (which is why there's no "full name" field here).
    setInviting(true)
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: inviteForm.role, department_id: departmentId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const fieldMessage = data?.details?.email?.[0]
        setInviteError(fieldMessage ? `Email: ${fieldMessage}` : data.error || "Couldn't send the invitation. Please try again.")
        return
      }

      await refreshInvitations()
      setInviteOpen(false)

      // The API honestly reports whether the email actually sent — surface
      // that instead of always claiming success, and hand the admin the link.
      if (data.emailSent) {
        toast.success(`Invitation sent to ${email}. They'll appear in the list once they accept.`)
      } else {
        const reason = data.emailDomainNotVerified ? "your sending domain isn't verified yet" : "the email couldn't be sent"
        try {
          await navigator.clipboard.writeText(data.inviteUrl)
          toast.warning(`Invitation created, but ${reason}. The link was copied — share it with ${email} directly.`, { duration: 8000 })
        } catch {
          toast.warning(`Invitation created, but ${reason}. Copy the link from "Pending invitations" below and share it with ${email}.`, { duration: 10000 })
        }
      }
    } catch (err) {
      console.error("[Users] invitation failed:", err)
      setInviteError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setInviting(false)
    }
  }

  function openEdit(target: User) {
    setEditing(target)
    setEditForm({ role: target.role, department_id: target.department_id || NO_DEPARTMENT })
    setEditError(null)
  }

  const editingSelf = editing?.id === user?.id
  const editingLastAdmin = !!editing && editing.role === "admin" && editing.status === "active" && activeAdminCount <= 1

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing || savingEdit) return
    setEditError(null)

    const roleChanged = editForm.role !== editing.role
    const nextDept = editForm.department_id === NO_DEPARTMENT ? null : editForm.department_id
    const deptChanged = (nextDept ?? null) !== (editing.department_id ?? null)

    if (!roleChanged && !deptChanged) {
      setEditing(null)
      return
    }
    if (roleChanged && editingSelf) {
      setEditError("You can't change your own role. Ask another admin to do it.")
      return
    }
    if (roleChanged && editingLastAdmin) {
      setEditError("This is the only active admin. Promote another user to admin first.")
      return
    }

    setSavingEdit(true)
    try {
      await updateUser(editing.id, { role: editForm.role, department_id: nextDept } as unknown as Partial<User>)
      const parts: string[] = []
      if (roleChanged) parts.push(`role is now ${getRoleLabel(editForm.role)}`)
      if (deptChanged) parts.push(nextDept ? `department is now ${departmentName(nextDept) ?? "updated"}` : "removed from their department")
      toast.success(`${editing.full_name}: ${parts.join(" and ")}.`)
      setEditing(null)
    } catch (err) {
      console.error("[Users] update failed:", err)
      setEditError(errorText(err, "Couldn't save changes. Please try again."))
    } finally {
      setSavingEdit(false)
    }
  }

  async function confirmStatusChange() {
    if (!statusTarget || changingStatus) return
    const { user: target, next } = statusTarget
    setChangingStatus(true)
    try {
      await updateUser(target.id, { status: next, is_active: next === "active" } as unknown as Partial<User>)
      toast.success(next === "active" ? `${target.full_name} was reactivated and can sign in again.` : `${target.full_name} was deactivated and can no longer sign in.`)
      setStatusTarget(null)
    } catch (err) {
      console.error("[Users] status update failed:", err)
      toast.error(errorText(err, "Couldn't update this user. Please try again."))
    } finally {
      setChangingStatus(false)
    }
  }

  async function confirmRevoke() {
    if (!revokeTarget || revoking) return
    setRevoking(true)
    try {
      const res = await fetch(`/api/invitations?id=${encodeURIComponent(revokeTarget.id)}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Couldn't revoke the invitation")
      await refreshInvitations()
      toast.success(`Invitation for ${revokeTarget.email} was revoked.`)
      setRevokeTarget(null)
    } catch (err) {
      toast.error(errorText(err, "Couldn't revoke the invitation. Please try again."))
    } finally {
      setRevoking(false)
    }
  }

  async function copyInviteLink(invite: InvitationRow) {
    const link = `${window.location.origin}/accept-invitation?token=${invite.token}`
    try {
      await navigator.clipboard.writeText(link)
      toast.success("Invitation link copied.")
    } catch {
      toast.error("Couldn't copy automatically. Select the link manually from your browser's address after opening it.")
    }
  }

  // Deactivating yourself, or the last active admin, would lock the org out.
  function statusBlockReason(target: User): string | null {
    if (target.id === user?.id) return "You can't deactivate your own account."
    if (target.status === "active" && target.role === "admin" && activeAdminCount <= 1) return "This is the only active admin."
    return null
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-4">
          <Shield className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <h1 className="font-heading font-bold mb-1">Admin only</h1>
        <p className="text-sm text-muted-foreground max-w-sm mb-5">
          Managing users needs the Admin role. You&apos;re signed in as {user ? getRoleLabel(user.role) : "a team member"}, so ask an admin if you need someone added or changed.
        </p>
        <Button asChild variant="outline" className="font-semibold">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    )
  }

  const roleBadge = (role: UserRole) => (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider", roleColors[role])}>
      {getRoleLabel(role)}
    </span>
  )

  const statusLabel = (u: User) => (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", u.status === "active" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
      <span className={cn("w-1.5 h-1.5 rounded-full", u.status === "active" ? "bg-emerald-500" : "bg-gray-400")} />
      {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
    </span>
  )

  const rowActions = (u: User) => {
    const blocked = statusBlockReason(u)
    const nextStatus = u.status === "active" ? "inactive" : "active"
    return (
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="h-9 gap-1.5 bg-transparent" onClick={() => openEdit(u)} aria-label={`Edit ${u.full_name}`}>
          <Pencil className="w-3.5 h-3.5" /> Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 bg-transparent"
          disabled={!!blocked && u.status === "active"}
          title={blocked && u.status === "active" ? blocked : undefined}
          onClick={() => setStatusTarget({ user: u, next: nextStatus })}
          aria-label={`${u.status === "active" ? "Deactivate" : "Reactivate"} ${u.full_name}`}
        >
          {u.status === "active" ? <><UserX className="w-3.5 h-3.5" /> Deactivate</> : <><UserCheck className="w-3.5 h-3.5" /> Reactivate</>}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {activeCount} active {activeCount === 1 ? "member" : "members"}
            {!isDemo && pendingInvites.length > 0 ? ` · ${pendingInvites.length} pending ${pendingInvites.length === 1 ? "invitation" : "invitations"}` : ""}
          </p>
        </div>
        <Button className="shadow-sm shadow-primary/25 font-semibold w-full sm:w-auto" onClick={openInvite}>
          <Plus className="w-4 h-4 mr-2" /> Invite user
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input aria-label="Search users" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 sm:h-9 text-sm" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger aria-label="Filter by role" className="w-full sm:w-40 h-10 sm:h-9 text-sm">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-border/60">
          <CardContent>
            <EmptyState
              icon={UsersIcon}
              title={users.length <= 1 && !search && roleFilter === "all" ? "It's just you so far" : "No users match your filters"}
              description={
                users.length <= 1 && !search && roleFilter === "all"
                  ? "Invite teammates so they can submit and approve expenses."
                  : "Try a different name, email or role, or clear the filters."
              }
              actionLabel={users.length <= 1 && !search && roleFilter === "all" ? "Invite user" : undefined}
              onAction={openInvite}
              secondaryLabel={search || roleFilter !== "all" ? "Clear filters" : undefined}
              onSecondary={() => {
                setSearch("")
                setRoleFilter("all")
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: one card per user */}
          <div className="flex flex-col gap-3 lg:hidden">
            {filtered.map((u) => (
              <Card key={u.id} className="border-border/60">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{getInitials(u.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold break-words">
                        {u.full_name}
                        {u.id === user?.id && <span className="ml-1.5 text-[10px] font-semibold uppercase text-primary">You</span>}
                      </p>
                      <p className="text-xs text-muted-foreground break-all">{u.email}</p>
                    </div>
                    {statusLabel(u)}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                    {roleBadge(u.role)}
                    <span>{departmentName(u.department_id) || "No department"}</span>
                    <span>Joined {formatDate(u.created_at)}</span>
                  </div>
                  {rowActions(u)}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <Card className="border-border/60 overflow-hidden hidden lg:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/60">
                      {["User", "Role", "Department", "Status", "Joined", "Actions"].map((h) => (
                        <TableHead key={h} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => (
                      <TableRow key={u.id} className="hover:bg-secondary/40 border-border/40 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">{getInitials(u.full_name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">
                                {u.full_name}
                                {u.id === user?.id && <span className="ml-1.5 text-[10px] font-semibold uppercase text-primary">You</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{roleBadge(u.role)}</TableCell>
                        <TableCell className="text-sm">{departmentName(u.department_id) || <span className="text-muted-foreground">No department</span>}</TableCell>
                        <TableCell>{statusLabel(u)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">{formatDate(u.created_at)}</TableCell>
                        <TableCell>{rowActions(u)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Pending invitations — invited people aren't users until they accept */}
      {!isDemo && (
        <section aria-labelledby="pending-invites-heading" className="flex flex-col gap-3">
          <div>
            <h2 id="pending-invites-heading" className="font-heading text-lg font-bold tracking-tight">Pending invitations</h2>
            <p className="text-sm text-muted-foreground">People you&apos;ve invited who haven&apos;t accepted yet. They&apos;ll show up in the list above once they do.</p>
          </div>
          {invitationsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading invitations…</div>
          ) : invitationsError ? (
            <div role="alert" className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-300">
              <span className="flex items-start gap-2 flex-1"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {errorText(invitationsError, "Couldn't load invitations.")}</span>
              <Button variant="outline" size="sm" className="bg-transparent" onClick={() => void refreshInvitations()}>Retry</Button>
            </div>
          ) : pendingInvites.length === 0 ? (
            <Card className="border-border/60 border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">No pending invitations.</CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {pendingInvites.map((invite) => {
                const expired = new Date(invite.expires_at).getTime() < Date.now()
                return (
                  <Card key={invite.id} className="border-border/60">
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary shrink-0"><Mail className="w-4 h-4 text-muted-foreground" /></div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold break-all">{invite.email}</p>
                          <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                            {roleBadge(invite.role)}
                            <span>{departmentName(invite.department_id) || "No department"}</span>
                            <span className={cn("inline-flex items-center gap-1", expired && "text-red-600")}>
                              <Clock className="w-3 h-3" />
                              {expired ? "Expired" : `Expires ${formatDate(invite.expires_at)}`}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!expired && (
                          <Button variant="outline" size="sm" className="h-9 gap-1.5 bg-transparent" onClick={() => void copyInviteLink(invite)}>
                            <Copy className="w-3.5 h-3.5" /> Copy link
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="h-9 gap-1.5 bg-transparent" onClick={() => setRevokeTarget(invite)} aria-label={`Revoke invitation for ${invite.email}`}>
                          <X className="w-3.5 h-3.5" /> Revoke
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={(open) => !inviting && setInviteOpen(open)}>
        <DialogContent className="rounded-2xl">
          <form onSubmit={handleInvite} noValidate className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="font-heading">Invite a team member</DialogTitle>
              <DialogDescription>
                We&apos;ll email them a link to set their name and password. Fields marked <span className="text-destructive">*</span> are required.
              </DialogDescription>
            </DialogHeader>

            {inviteError && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 px-3 py-2.5 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{inviteError}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-email" className="text-[13px] font-medium">Email <span className="text-destructive">*</span></Label>
              <Input
                id="invite-email"
                type="email"
                inputMode="email"
                autoComplete="off"
                autoFocus
                placeholder="name@company.com"
                value={inviteForm.email}
                onChange={(e) => {
                  setInviteForm({ ...inviteForm, email: e.target.value })
                  if (inviteEmailError) setInviteEmailError(null)
                }}
                aria-invalid={!!inviteEmailError}
                aria-describedby={inviteEmailError ? "invite-email-error" : undefined}
                className="h-10"
              />
              {inviteEmailError && <p id="invite-email-error" className="text-xs text-destructive">{inviteEmailError}</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="invite-role" className="text-[13px] font-medium">Role <span className="text-destructive">*</span></Label>
                <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v as UserRole })}>
                  <SelectTrigger id="invite-role" className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="invite-department" className="text-[13px] font-medium">Department</Label>
                <Select value={inviteForm.department_id} onValueChange={(v) => setInviteForm({ ...inviteForm, department_id: v })}>
                  <SelectTrigger id="invite-department" className="h-10"><SelectValue placeholder="No department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_DEPARTMENT}>No department</SelectItem>
                    {activeDepartments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">{ROLE_DESCRIPTIONS[inviteForm.role]}{inviteForm.role === "manager" && inviteForm.department_id === NO_DEPARTMENT ? " Assign a department so they can approve their team's requests." : ""}</p>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>Cancel</Button>
              <Button type="submit" disabled={inviting} className="font-semibold shadow-sm shadow-primary/20">
                {inviting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : "Send invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && !savingEdit && setEditing(null)}>
        <DialogContent className="rounded-2xl">
          {editing && (
            <form onSubmit={handleSaveEdit} noValidate className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle className="font-heading">Edit {editing.full_name}</DialogTitle>
                <DialogDescription className="break-all">{editing.email}</DialogDescription>
              </DialogHeader>

              {editError && (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 px-3 py-2.5 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{editError}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-role" className="text-[13px] font-medium">Role</Label>
                  <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v as UserRole })} disabled={editingSelf || editingLastAdmin}>
                    <SelectTrigger id="edit-role" className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-department" className="text-[13px] font-medium">Department</Label>
                  <Select value={editForm.department_id} onValueChange={(v) => setEditForm({ ...editForm, department_id: v })}>
                    <SelectTrigger id="edit-department" className="h-10"><SelectValue placeholder="No department" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_DEPARTMENT}>No department</SelectItem>
                      {departments.filter((d) => d.is_active !== false || d.id === editing.department_id).map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}{d.is_active === false ? " (archived)" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                {editingSelf
                  ? "You can't change your own role, but you can change your department."
                  : editingLastAdmin
                    ? "This is the only active admin, so the role is locked. Promote someone else first."
                    : ROLE_DESCRIPTIONS[editForm.role]}
              </p>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={savingEdit}>Cancel</Button>
                <Button type="submit" disabled={savingEdit} className="font-semibold shadow-sm shadow-primary/20">
                  {savingEdit ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate / reactivate confirmation */}
      <AlertDialog open={!!statusTarget} onOpenChange={(open) => !open && !changingStatus && setStatusTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{statusTarget?.next === "inactive" ? `Deactivate ${statusTarget?.user.full_name}?` : `Reactivate ${statusTarget?.user.full_name}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget?.next === "inactive"
                ? "They will lose access the next time the app loads for them and won't be able to sign in. Their past requests stay in your records. You can reactivate them at any time."
                : "They will be able to sign in again with their existing password."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={changingStatus}
              onClick={(e) => {
                e.preventDefault()
                void confirmStatusChange()
              }}
              className={statusTarget?.next === "inactive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            >
              {changingStatus ? "Working…" : statusTarget?.next === "inactive" ? "Deactivate" : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke invitation confirmation */}
      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && !revoking && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              The link sent to {revokeTarget?.email} will stop working. You can send a new invitation later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Keep invitation</AlertDialogCancel>
            <AlertDialogAction
              disabled={revoking}
              onClick={(e) => {
                e.preventDefault()
                void confirmRevoke()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking ? "Revoking…" : "Revoke invitation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
