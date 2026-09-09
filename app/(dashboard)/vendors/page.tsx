"use client"

import { useMemo, useState } from "react"
import { Plus, Search, Store, CheckCircle2, XCircle, Mail, Phone, MapPin, Archive, ArchiveRestore } from "lucide-react"
import { useData, useAuth } from "@/lib/providers"
import { generateId, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export default function VendorsPage() {
  const { vendors, addVendor, updateVendor, organization, currentUser } = useData()
  const { dbUser } = useAuth()
  // Matches the "Finance/admin can manage vendors" RLS policy: only these
  // roles can actually toggle vendor approval, so only they get the control.
  const canManageVendors = ["admin", "finance", "manager"].includes((dbUser || currentUser)?.role ?? "")
  const [search, setSearch] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", category: "", contact_email: "", contact_phone: "", address: "", payment_terms: "", notes: "" })

  const archivedCount = useMemo(() => vendors.filter((v) => v.is_active === false).length, [vendors])

  const filtered = useMemo(() => {
    const base = showArchived ? vendors : vendors.filter((v) => v.is_active !== false)
    if (!search) return base
    const q = search.toLowerCase()
    return base.filter((v) => v.name.toLowerCase().includes(q) || v.category?.toLowerCase().includes(q))
  }, [vendors, search, showArchived])

  async function handleAdd() {
    if (!form.name.trim()) { toast.error("Vendor name is required"); return }
    setSaving(true)
    const now = new Date().toISOString()
    try {
      await addVendor({
        id: generateId(), organization_id: organization?.id || currentUser?.organization_id || "", name: form.name, category: form.category || undefined,
        contact_email: form.contact_email || undefined, contact_phone: form.contact_phone || undefined,
        address: form.address || undefined, payment_terms: form.payment_terms || undefined, notes: form.notes || undefined,
        is_approved: true, approval_required: false, created_at: now, updated_at: now,
      })
      toast.success("Vendor added successfully")
      setForm({ name: "", category: "", contact_email: "", contact_phone: "", address: "", payment_terms: "", notes: "" })
      setDialogOpen(false)
    } catch (err) {
      console.error("[Vendors] create failed:", err)
      toast.error("Failed to add vendor. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleApproved(vendorId: string, checked: boolean) {
    try {
      await updateVendor(vendorId, { is_approved: checked })
    } catch (err) {
      console.error("[Vendors] update failed:", err)
      toast.error("Failed to update vendor status. Please try again.")
    }
  }

  async function handleToggleArchived(vendorId: string, name: string, archive: boolean) {
    if (archive && !window.confirm(`Archive "${name}"? It won't be selectable on new expense requests, but stays on past ones.`)) return
    setArchivingId(vendorId)
    try {
      await updateVendor(vendorId, { is_active: !archive })
      toast.success(archive ? `${name} archived` : `${name} restored`)
    } catch (err) {
      console.error("[Vendors] archive toggle failed:", err)
      toast.error("Failed to update vendor. Please try again.")
    } finally {
      setArchivingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{vendors.length} registered vendors</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm shadow-primary/25 font-semibold"><Plus className="w-4 h-4 mr-2" /> Add Vendor</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Add New Vendor</DialogTitle>
              <DialogDescription>Register a new vendor for expense requests.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2"><Label className="text-[13px] font-medium">Name *</Label><Input placeholder="Vendor name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="flex flex-col gap-2"><Label className="text-[13px] font-medium">Category</Label><Input placeholder="e.g. Software" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2"><Label className="text-[13px] font-medium">Email</Label><Input type="email" placeholder="contact@vendor.com" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
                <div className="flex flex-col gap-2"><Label className="text-[13px] font-medium">Phone</Label><Input placeholder="+1 (555) 000-0000" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
              </div>
              <div className="flex flex-col gap-2"><Label className="text-[13px] font-medium">Address</Label><Input placeholder="123 Main St" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label className="text-[13px] font-medium">Payment Terms</Label><Input placeholder="e.g. Net 30" value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label className="text-[13px] font-medium">Notes</Label><Textarea placeholder="Additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            </div>
            <DialogFooter><Button onClick={handleAdd} disabled={saving} className="font-semibold shadow-sm shadow-primary/20">{saving ? "Adding..." : "Add Vendor"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        {archivedCount > 0 && (
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
            Show archived ({archivedCount})
          </label>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-4"><Store className="w-7 h-7 text-muted-foreground/40" /></div>
          <h3 className="font-heading font-bold mb-1">No vendors found</h3>
          <p className="text-sm text-muted-foreground">Add your first vendor to get started.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vendor) => {
            const archived = vendor.is_active === false
            return (
            <Card key={vendor.id} className={cn("border-border/60 hover:border-primary/20 transition-all duration-200 hover:shadow-md hover:shadow-foreground/[0.03] hover:-translate-y-0.5 group", archived && "opacity-60")}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary">
                      <Store className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-sm">{vendor.name}</h3>
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
                        onClick={() => handleToggleArchived(vendor.id, vendor.name, !archived)}
                        disabled={archivingId === vendor.id}
                        className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                        aria-label={archived ? `Restore ${vendor.name}` : `Archive ${vendor.name}`}
                      >
                        {archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  {vendor.contact_email && <div className="flex items-center gap-2"><Mail className="w-3 h-3" /><span>{vendor.contact_email}</span></div>}
                  {vendor.contact_phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3" /><span>{vendor.contact_phone}</span></div>}
                  {vendor.address && <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /><span className="truncate">{vendor.address}</span></div>}
                </div>
                {vendor.payment_terms && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Payment Terms</p>
                    <p className="text-xs">{vendor.payment_terms}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Approved</span>
                  {canManageVendors ? (
                    <Switch checked={vendor.is_approved} onCheckedChange={(checked) => handleToggleApproved(vendor.id, checked)} />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">{vendor.is_approved ? "Yes" : "No"}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}
    </div>
  )
}
