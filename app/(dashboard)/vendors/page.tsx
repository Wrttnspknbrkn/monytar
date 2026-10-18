"use client"

import { useMemo, useState } from "react"
import { Plus, Search, Store, CheckCircle2, XCircle, Mail, Phone, MapPin, Archive, ArchiveRestore, Loader2, AlertCircle } from "lucide-react"
import { useData, useAuth } from "@/lib/providers"
import { generateId, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
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
import { EmptyState } from "@/components/ui/empty-state"
import { useInitialSearchQuery } from "@/lib/hooks/use-url-query"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/errors"

// "Payment terms" is how long you have to pay a vendor once they send their invoice. It is a note for
// your records: it does not change how requests are approved or paid in Monytar.
const DEFAULT_PAYMENT_TERMS = "Net 30"
const PAYMENT_TERMS_OPTIONS = ["Due on receipt", "Net 7", "Net 15", "Net 30", "Net 45", "Net 60", "Net 90"]
const EMPTY_VENDOR_FORM = { name: "", category: "", contact_email: "", contact_phone: "", address: "", payment_terms: DEFAULT_PAYMENT_TERMS, notes: "" }

export default function VendorsPage() {
  const { vendors, addVendor, updateVendor, organization, currentUser } = useData()
  const { dbUser } = useAuth()
  // Matches the "Finance/admin can manage vendors" RLS policy: only these
  // roles can actually toggle vendor approval, so only they get the control.
  const canManageVendors = ["admin", "finance", "manager"].includes((dbUser || currentUser)?.role ?? "")
  const [search, setSearch] = useState("")
  useInitialSearchQuery(setSearch)
  const [formError, setFormError] = useState<string | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<{ id: string; name: string; archive: boolean } | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_VENDOR_FORM)

  const archivedCount = useMemo(() => vendors.filter((v) => v.is_active === false).length, [vendors])

  const filtered = useMemo(() => {
    const base = showArchived ? vendors : vendors.filter((v) => v.is_active !== false)
    if (!search) return base
    const q = search.toLowerCase()
    return base.filter((v) => v.name.toLowerCase().includes(q) || v.category?.toLowerCase().includes(q))
  }, [vendors, search, showArchived])

  async function handleAdd(e?: React.FormEvent) {
    e?.preventDefault()
    if (saving) return
    setFormError(null)
    if (!form.name.trim()) { setFormError("Vendor name is required."); return }
    if (form.contact_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.contact_email.trim())) { setFormError("Enter a valid contact email, or leave it blank."); return }
    if (vendors.some((v) => v.name.trim().toLowerCase() === form.name.trim().toLowerCase())) { setFormError("A vendor with this name already exists."); return }
    setSaving(true)
    const now = new Date().toISOString()
    try {
      const created = await addVendor({
        id: generateId(), organization_id: organization?.id || currentUser?.organization_id || "", name: form.name, category: form.category || undefined,
        contact_email: form.contact_email || undefined, contact_phone: form.contact_phone || undefined,
        address: form.address || undefined, payment_terms: form.payment_terms || undefined, notes: form.notes || undefined,
        is_approved: true, approval_required: false, created_at: now, updated_at: now,
      })
      if (created?.notes_not_saved) {
        toast.warning(`${form.name.trim()} was added, but its note couldn't be saved yet. Ask your administrator to apply the latest database update, then add the note again.`)
      } else {
        toast.success(`${form.name.trim()} was added and is ready to use on requests.`)
      }
      setForm(EMPTY_VENDOR_FORM)
      setDialogOpen(false)
    } catch (err) {
      console.error("[Vendors] create failed:", err)
      setFormError(getErrorMessage(err, "Couldn't add the vendor. Please try again."))
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleApproved(vendorId: string, checked: boolean) {
    try {
      await updateVendor(vendorId, { is_approved: checked })
      toast.success(checked ? "Vendor approved." : "Vendor marked as pending approval.")
    } catch (err) {
      console.error("[Vendors] update failed:", err)
      toast.error("Failed to update vendor status. Please try again.")
    }
  }

  async function confirmArchive() {
    if (!archiveTarget || archivingId) return
    const { id, name, archive } = archiveTarget
    setArchivingId(id)
    try {
      await updateVendor(id, { is_active: !archive })
      toast.success(archive ? `${name} was archived.` : `${name} was restored.`)
      setArchiveTarget(null)
    } catch (err) {
      console.error("[Vendors] archive toggle failed:", err)
      toast.error("Couldn't update the vendor. Please try again.")
    } finally {
      setArchivingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{vendors.filter((v) => v.is_active !== false).length} active {vendors.filter((v) => v.is_active !== false).length === 1 ? "vendor" : "vendors"}</p>
        </div>
        <Button className="shadow-sm shadow-primary/25 font-semibold w-full sm:w-auto" onClick={() => { setFormError(null); setDialogOpen(true) }}><Plus className="w-4 h-4 mr-2" /> Add vendor</Button>
        <Dialog open={dialogOpen} onOpenChange={(open) => !saving && setDialogOpen(open)}>
          <DialogContent className="rounded-2xl max-w-lg">
            <form onSubmit={handleAdd} noValidate className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="font-heading">Add a vendor</DialogTitle>
              <DialogDescription>Register who you pay so requests can reference them. Fields marked <span className="text-destructive">*</span> are required.</DialogDescription>
            </DialogHeader>
            {formError && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 px-3 py-2.5 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{formError}</span>
              </div>
            )}
            <div className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2"><Label htmlFor="vendor-name" className="text-[13px] font-medium">Name <span className="text-destructive">*</span></Label><Input id="vendor-name" autoFocus placeholder="Vendor name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="flex flex-col gap-2"><Label htmlFor="vendor-category" className="text-[13px] font-medium">Category</Label><Input id="vendor-category" placeholder="e.g. Software" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2"><Label htmlFor="vendor-email" className="text-[13px] font-medium">Email</Label><Input id="vendor-email" type="email" placeholder="contact@vendor.com" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
                <div className="flex flex-col gap-2"><Label htmlFor="vendor-phone" className="text-[13px] font-medium">Phone</Label><Input id="vendor-phone" type="tel" placeholder="+1 (555) 000-0000" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
              </div>
              <div className="flex flex-col gap-2"><Label htmlFor="vendor-address" className="text-[13px] font-medium">Address</Label><Input id="vendor-address" placeholder="123 Main St" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="vendor-terms" className="text-[13px] font-medium">Payment terms</Label>
                <Input id="vendor-terms" list="vendor-terms-options" aria-describedby="vendor-terms-help" placeholder="e.g. Net 30" value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} />
                <datalist id="vendor-terms-options">{PAYMENT_TERMS_OPTIONS.map((o) => <option key={o} value={o} />)}</datalist>
                <p id="vendor-terms-help" className="text-xs text-muted-foreground">
                  How long you have to pay this vendor after they send their invoice. <b className="font-semibold text-foreground">Net 30</b> means within 30 days; <b className="font-semibold text-foreground">Due on receipt</b> means straight away. It&apos;s for your records and doesn&apos;t change how requests are approved.
                </p>
              </div>
              <div className="flex flex-col gap-2"><Label htmlFor="vendor-notes" className="text-[13px] font-medium">Notes</Label><Textarea id="vendor-notes" placeholder="Additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving} className="font-semibold shadow-sm shadow-primary/20">{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding…</> : "Add vendor"}</Button>
            </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input aria-label="Search vendors" placeholder="Search by name or category…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        {archivedCount > 0 && (
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
            Show archived ({archivedCount})
          </label>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Store}
          title={search ? "No vendors match your search" : "No vendors yet"}
          description={search ? "Try a different name or category." : "Add the companies and people you pay so requests can reference them."}
          actionLabel={search ? undefined : "Add vendor"}
          onAction={() => { setFormError(null); setDialogOpen(true) }}
          secondaryLabel={search ? "Clear search" : undefined}
          onSecondary={() => setSearch("")}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vendor) => {
            const archived = vendor.is_active === false
            return (
            <Card key={vendor.id} className={cn("min-w-0 border-border/60 hover:border-primary/20 transition-all duration-200 hover:shadow-md hover:shadow-foreground/[0.03] hover:-translate-y-0.5 group", archived && "opacity-60")}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary shrink-0">
                      <Store className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-sm break-words">{vendor.name}</h2>
                      {vendor.category && <p className="text-xs text-muted-foreground">{vendor.category}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {archived && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider bg-secondary text-muted-foreground border-border">
                        Archived
                      </span>
                    )}
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider",
                      vendor.is_approved
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                    )}>
                      {vendor.is_approved ? <><CheckCircle2 className="w-3 h-3" /> Approved</> : <><XCircle className="w-3 h-3" /> Pending</>}
                    </span>
                    {canManageVendors && (
                      <button
                        type="button"
                        onClick={() => setArchiveTarget({ id: vendor.id, name: vendor.name, archive: !archived })}
                        disabled={archivingId === vendor.id}
                        title={archived ? "Restore vendor" : "Archive vendor"}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
                        aria-label={archived ? `Restore ${vendor.name}` : `Archive ${vendor.name}`}
                      >
                        {archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  {vendor.contact_email && <div className="flex items-center gap-2"><Mail className="w-3 h-3" /><span className="break-all">{vendor.contact_email}</span></div>}
                  {vendor.contact_phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3" /><span>{vendor.contact_phone}</span></div>}
                  {vendor.address && <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /><span className="truncate">{vendor.address}</span></div>}
                </div>
                {vendor.payment_terms && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5" title="How long you have to pay this vendor after they send their invoice">Payment Terms</p>
                    <p className="text-xs">{vendor.payment_terms}</p>
                  </div>
                )}
                {vendor.notes && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Notes</p>
                    <p className="text-xs whitespace-pre-line break-words">{vendor.notes}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Approved</span>
                  {canManageVendors ? (
                    <Switch aria-label={`Approved: ${vendor.name}`} checked={vendor.is_approved} onCheckedChange={(checked) => handleToggleApproved(vendor.id, checked)} />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">{vendor.is_approved ? "Yes" : "No"}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}

      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && !archivingId && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{archiveTarget?.archive ? `Archive ${archiveTarget.name}?` : `Restore ${archiveTarget?.name}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget?.archive
                ? "It won't be selectable on new expense requests, but stays on past ones. You can restore it any time."
                : "It will be selectable on new expense requests again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!archivingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={!!archivingId} onClick={(e) => { e.preventDefault(); void confirmArchive() }}>
              {archivingId ? "Working…" : archiveTarget?.archive ? "Archive" : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
