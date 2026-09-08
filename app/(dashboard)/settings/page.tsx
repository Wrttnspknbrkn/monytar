"use client"

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react"
import { User, Building2, Bell, Palette, Save, Check, Moon, Sun, Monitor, DollarSign, CreditCard, ArrowRight, ArrowUpRight, Loader2, Tag, Plus, Trash2, Lock, ImageIcon, X } from "lucide-react"
import { useData, useAuth } from "@/lib/providers"
import { getRoleLabel, formatCurrency, getCategoryLabel, cn } from "@/lib/utils"
import { useExpenseCategories } from "@/lib/hooks/use-categories"
import { uploadOrgLogo, removeOrgLogo, validateLogoFile } from "@/lib/logo/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import Link from "next/link"
import { mutate } from "swr"
import { PRODUCTS, type Product } from "@/lib/products"
import { openBillingPortal, createSubscriptionUpdateSession, cancelSubscription } from "@/app/actions/stripe"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { SUPPORTED_CURRENCIES } from "@/lib/currency"

export default function SettingsPage() {
  const { dbUser } = useAuth()
  const { currentUser, departments, updateUser, orgSettings, updateOrgSettings, organization } = useData()
  const { theme, setTheme } = useTheme()
  
  const user = dbUser || currentUser
  const dept = user ? departments.find((d) => d.id === user.department_id) : undefined
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
  })

  // `user` loads asynchronously (SWR), so it's frequently still null on the
  // render that initializes this state above — without this effect the
  // fields stay permanently blank even once the user's data arrives.
  useEffect(() => {
    if (user) {
      setProfileForm({ full_name: user.full_name, email: user.email })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])
  const [saved, setSaved] = useState(false)
  const [currencySaved, setCurrencySaved] = useState(false)
  const [notifSettings, setNotifSettings] = useState({
    email_on_approve: true,
    email_on_reject: true,
    email_on_payment: true,
    push_notifications: false,
    digest_frequency: "daily",
  })

  const [savingProfile, setSavingProfile] = useState(false)

  async function handleSaveProfile() {
    if (!user) return
    setSavingProfile(true)
    try {
      await updateUser(user.id, { full_name: profileForm.full_name, email: profileForm.email })
      setSaved(true)
      toast.success("Profile updated successfully")
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error("[Settings] profile update failed:", err)
      toast.error("Failed to update profile. Please try again.")
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleCurrencyChange(code: string) {
    try {
      await updateOrgSettings({ default_currency: code })
      setCurrencySaved(true)
      toast.success(`Currency changed to ${code}`)
      setTimeout(() => setCurrencySaved(false), 2000)
    } catch (err) {
      console.error("[Settings] currency update failed:", err)
      toast.error("Failed to update currency. Please try again.")
    }
  }

  const [workflowForm, setWorkflowForm] = useState({
    auto_approve_under_amount: 0,
    receipt_required_above_amount: 0,
    approval_threshold_amount: 0,
    require_manager_approval: true,
    require_finance_approval: true,
    require_receipts: true,
  })
  const [savingWorkflow, setSavingWorkflow] = useState(false)

  // orgSettings loads asynchronously — sync local form state once it (or a
  // later update to it) arrives, same pattern as profileForm above.
  useEffect(() => {
    if (orgSettings) {
      setWorkflowForm({
        auto_approve_under_amount: orgSettings.auto_approve_under_amount ?? 0,
        receipt_required_above_amount: orgSettings.receipt_required_above_amount ?? 0,
        approval_threshold_amount: orgSettings.approval_threshold_amount ?? 0,
        require_manager_approval: orgSettings.require_manager_approval ?? true,
        require_finance_approval: orgSettings.require_finance_approval ?? true,
        require_receipts: orgSettings.require_receipts ?? true,
      })
    }
  }, [orgSettings])

  async function handleSaveWorkflow() {
    if (workflowForm.auto_approve_under_amount < 0 || workflowForm.receipt_required_above_amount < 0 || workflowForm.approval_threshold_amount < 0) {
      toast.error("Threshold amounts can't be negative.")
      return
    }
    setSavingWorkflow(true)
    try {
      await updateOrgSettings(workflowForm)
      toast.success("Approval workflow settings updated")
    } catch (err) {
      console.error("[Settings] workflow update failed:", err)
      toast.error("Failed to update approval settings. Please try again.")
    } finally {
      setSavingWorkflow(false)
    }
  }

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [updatingPassword, setUpdatingPassword] = useState(false)
  // This project has Supabase's "secure password change" setting on, which
  // requires a freshly-issued reauthentication code (emailed one-time code,
  // not just re-entering the current password) before updateUser({password})
  // will succeed — confirmed live via the API's `current_password_required`
  // error. So this is a two-step flow: request a code, then confirm it.
  const [awaitingReauthCode, setAwaitingReauthCode] = useState(false)
  const [reauthCode, setReauthCode] = useState("")

  async function handleRequestPasswordChange() {
    if (!isSupabaseConfigured()) {
      toast.error("Password changes are not available in demo mode.")
      return
    }
    if (!user?.email) return
    if (!currentPassword) {
      toast.error("Enter your current password.")
      return
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.")
      return
    }
    setUpdatingPassword(true)
    try {
      const supabase = getSupabaseBrowserClient()
      // Re-verify the current password before requesting a reauth code, so
      // an open/hijacked session can't trigger this on the real owner.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (verifyError) {
        toast.error("Current password is incorrect.")
        return
      }
      const { error: reauthError } = await supabase.auth.reauthenticate()
      if (reauthError) throw reauthError
      setAwaitingReauthCode(true)
      toast.success("Check your email for a confirmation code.")
    } catch (err) {
      console.error("[Settings] password reauth request failed:", err)
      toast.error("Failed to start the password change. Please try again.")
    } finally {
      setUpdatingPassword(false)
    }
  }

  async function handleConfirmPasswordChange() {
    if (!reauthCode) {
      toast.error("Enter the code from your email.")
      return
    }
    setUpdatingPassword(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword, nonce: reauthCode })
      if (updateError) throw updateError
      toast.success("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setReauthCode("")
      setAwaitingReauthCode(false)
    } catch (err) {
      console.error("[Settings] password update failed:", err)
      toast.error("That code didn't work. Please try again.")
    } finally {
      setUpdatingPassword(false)
    }
  }

  const [cancelLoading, setCancelLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [changingPlanId, setChangingPlanId] = useState<string | null>(null)

  const [logoUploading, setLogoUploading] = useState(false)

  async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const validationError = validateLogoFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }
    setLogoUploading(true)
    try {
      await uploadOrgLogo(file)
      toast.success("Logo updated")
      if (organization?.id) mutate(`organization:${organization.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload logo")
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleLogoRemove() {
    if (!window.confirm("Remove your organization logo?")) return
    setLogoUploading(true)
    try {
      await removeOrgLogo()
      toast.success("Logo removed")
      if (organization?.id) mutate(`organization:${organization.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove logo")
    } finally {
      setLogoUploading(false)
    }
  }

  const { categories, mutate: mutateCategories } = useExpenseCategories()
  const [newCategoryName, setNewCategoryName] = useState("")
  const [addingCategory, setAddingCategory] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    setAddingCategory(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Couldn't add category")
        return
      }
      toast.success(`"${newCategoryName.trim()}" added`)
      setNewCategoryName("")
      mutateCategories()
    } catch {
      toast.error("Couldn't add category. Please try again.")
    } finally {
      setAddingCategory(false)
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (!window.confirm(`Remove "${name}"? Existing requests keep it, but it won't be selectable for new ones.`)) return
    setDeletingCategoryId(id)
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Couldn't remove category")
        return
      }
      mutateCategories()
    } catch {
      toast.error("Couldn't remove category. Please try again.")
    } finally {
      setDeletingCategoryId(null)
    }
  }

  // Current plan detection based on org subscription tier + billing interval.
  // Free and Enterprise only ever have one row each; Starter/Professional
  // each have a separate monthly/yearly product row, so the interval matters.
  const tier = organization?.subscription_tier || "free"
  const billingInterval = organization?.billing_interval === "year" ? "yearly" : "monthly"
  const currentPlanId =
    tier === "free" ? "free" : tier === "enterprise" ? "enterprise-monthly" : `${tier}-${billingInterval}`
  const currentPlan = PRODUCTS.find((p) => p.id === currentPlanId) || PRODUCTS[0]

  async function handleManageBilling() {
    setPortalLoading(true)
    try {
      const result = await openBillingPortal()
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.url) {
        window.location.href = result.url
      }
    } catch {
      toast.error("Failed to open billing portal. Please try again.")
    } finally {
      setPortalLoading(false)
    }
  }

  function refreshOrganization() {
    if (organization?.id) mutate(`organization:${organization.id}`)
  }

  async function handleChangePlan(product: Product) {
    if (product.id === currentPlanId || !isAdminOrFinance) return

    // Enterprise has no self-serve checkout — the card below links to /contact instead.
    if (product.tier === "enterprise") return

    setChangingPlanId(product.id)
    try {
      if (product.priceInCents === 0) {
        // Downgrading to Free = cancelling the paid subscription.
        if (!organization?.stripe_subscription_id) {
          toast.error("No active subscription to cancel.")
          return
        }
        if (!window.confirm("You'll move to the Free plan at the end of your current billing period, and keep paid features until then. Continue?")) {
          return
        }
        const result = await cancelSubscription(organization.stripe_subscription_id)
        if (result.error) {
          toast.error(result.error)
          return
        }
        toast.success("Your subscription will end at the close of the current billing period, then you'll move to Free.")
        return
      }

      if (currentPlan.priceInCents === 0) {
        // Free -> paid: no existing subscription to update, so this needs a
        // real Checkout session. Return to Settings afterward, not /pricing.
        window.location.href = `/checkout?plan=${product.id}&returnTo=${encodeURIComponent("/settings")}`
        return
      }

      // Paid -> paid (upgrade, downgrade, or interval switch): update the
      // existing subscription in place with proration, no new checkout.
      const result = await createSubscriptionUpdateSession(product.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(`Plan updated to ${product.name}. This can take a few seconds to reflect here.`)
      // The DB row itself is only updated once the Stripe webhook fires;
      // give it a moment before refetching so we don't just re-show stale data.
      setTimeout(refreshOrganization, 3000)
    } catch {
      toast.error("Failed to change plan. Please try again.")
    } finally {
      setChangingPlanId(null)
    }
  }

  function handleCancelSubscription() {
    // Cancellation, plan changes, and payment methods are all handled securely
    // through Stripe's hosted Customer Portal.
    handleManageBilling()
  }

  const isAdminOrFinance = user?.role === "admin" || user?.role === "finance"
  
  if (!user) return null

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="h-9 gap-0.5 bg-secondary/60 p-0.5">
          <TabsTrigger value="profile" className="text-xs font-semibold h-8 px-4">
            <User className="w-3.5 h-3.5 mr-1.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="organization" className="text-xs font-semibold h-8 px-4">
            <Building2 className="w-3.5 h-3.5 mr-1.5" /> Organization
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs font-semibold h-8 px-4">
            <Bell className="w-3.5 h-3.5 mr-1.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs font-semibold h-8 px-4">
            <Palette className="w-3.5 h-3.5 mr-1.5" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-xs font-semibold h-8 px-4">
            <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Billing
          </TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="mt-5 flex flex-col gap-5">
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base font-bold">Personal Information</CardTitle>
              <CardDescription className="text-xs">Update your profile details</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex items-center gap-5">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-heading font-bold">{user.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider",
                      user.role === "admin" ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800" :
                      user.role === "finance" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" :
                      user.role === "manager" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" :
                      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                    )}>
                      {getRoleLabel(user.role)}
                    </span>
                    {dept && <span className="text-xs text-muted-foreground">{dept.name}</span>}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium">Full Name</Label>
                  <Input
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium">Email</Label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleSaveProfile} disabled={savingProfile} className="font-semibold shadow-sm shadow-primary/20">
                  {saved ? <><Check className="w-4 h-4 mr-2" /> Saved</> : <><Save className="w-4 h-4 mr-2" /> {savingProfile ? "Saving..." : "Save Changes"}</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base font-bold">Security</CardTitle>
              <CardDescription className="text-xs">Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!awaitingReauthCode ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="text-[13px] font-medium">Current Password</Label>
                      <PasswordInput placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-[13px] font-medium">New Password</Label>
                      <PasswordInput placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                  </div>
                  <Button variant="outline" disabled={updatingPassword} className="w-fit bg-transparent font-semibold" onClick={handleRequestPasswordChange}>
                    {updatingPassword ? "Sending code..." : "Update Password"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2 max-w-xs">
                    <Label className="text-[13px] font-medium">Confirmation Code</Label>
                    <p className="text-xs text-muted-foreground">Enter the code we just emailed you to confirm the change.</p>
                    <Input placeholder="123456" value={reauthCode} onChange={(e) => setReauthCode(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" disabled={updatingPassword} className="w-fit bg-transparent font-semibold" onClick={handleConfirmPasswordChange}>
                      {updatingPassword ? "Confirming..." : "Confirm New Password"}
                    </Button>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => { setAwaitingReauthCode(false); setReauthCode("") }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization */}
        <TabsContent value="organization" className="mt-5 flex flex-col gap-5">
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base font-bold">Organization Details</CardTitle>
              <CardDescription className="text-xs">View and manage your organization configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-y-5 gap-x-8">
                {[
                  { label: "Organization", value: organization?.name || "N/A" },
                  { label: "Slug", value: organization?.slug || "N/A" },
                  { label: "Plan", value: organization?.subscription_tier ? organization.subscription_tier.charAt(0).toUpperCase() + organization.subscription_tier.slice(1) : "Free" },
                  { label: "Auto Approve Threshold", value: formatCurrency(orgSettings?.auto_approve_under_amount || 0, orgSettings?.default_currency || "USD") },
                  { label: "Require Receipts Above", value: formatCurrency(orgSettings?.receipt_required_above_amount || 0, orgSettings?.default_currency || "USD") },
                  { label: "Fiscal Year Start", value: orgSettings?.fiscal_year_start || "January" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
                    <p className="text-sm font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Logo */}
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                <CardTitle className="font-heading text-base font-bold">Logo</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {user?.role === "admin" ? "Shown wherever your organization is identified in the product." : "Only admins can change the organization logo."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-secondary border border-border/60 overflow-hidden shrink-0">
                  {organization?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={organization.logo_url} alt={`${organization?.name || "Organization"} logo`} className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                  )}
                </div>
                {user?.role === "admin" && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="logo-upload" className={cn("inline-flex items-center h-9 px-4 rounded-lg border text-xs font-semibold cursor-pointer hover:bg-secondary/60 transition-colors", logoUploading && "opacity-50 pointer-events-none")}>
                      {logoUploading ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
                      {organization?.logo_url ? "Replace" : "Upload"}
                    </Label>
                    <input id="logo-upload" type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={handleLogoChange} disabled={logoUploading} className="sr-only" />
                    {organization?.logo_url && (
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={handleLogoRemove} disabled={logoUploading}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">JPG, PNG, WEBP, or SVG. Up to 2 MB.</p>
            </CardContent>
          </Card>

          {/* Currency Selector */}
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <CardTitle className="font-heading text-base font-bold">Currency</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {isAdminOrFinance
                  ? "Set the default currency for your organization. This affects how amounts are displayed across the platform."
                  : "Your organization's default currency. Contact an admin to change this setting."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-2 flex-1 max-w-xs">
                  <Label className="text-[13px] font-medium">Default Currency</Label>
                  <Select
                    value={orgSettings?.default_currency || "USD"}
                    onValueChange={handleCurrencyChange}
                    disabled={!isAdminOrFinance}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground w-8">{c.code}</span>
                            <span>{c.name}</span>
                            <span className="text-muted-foreground ml-1">({c.symbol})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {currencySaved && (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium mt-6">
                    <Check className="w-4 h-4" /> Updated
                  </div>
                )}
              </div>
              {!isAdminOrFinance && (
                <p className="text-xs text-muted-foreground">Only admins and finance users can change the organization currency.</p>
              )}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border/40">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Preview:</span> Amounts will display as{" "}
                  <span className="font-mono font-semibold">{formatCurrency(1234.56, orgSettings?.default_currency || "USD")}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Expense Categories */}
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <CardTitle className="font-heading text-base font-bold">Expense Categories</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {organization?.subscription_tier === "free"
                  ? "Add your own categories alongside the built-in six on the Starter plan or higher."
                  : "The built-in six categories, plus any your organization has added."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const isCustom = c.organization_id !== null
                  return (
                    <span
                      key={c.id}
                      className={cn(
                        "inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-medium border",
                        isCustom ? "bg-primary/5 border-primary/20 text-foreground" : "bg-secondary/50 border-border/60 text-muted-foreground",
                      )}
                    >
                      {getCategoryLabel(c.name)}
                      {isCustom && isAdminOrFinance && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          disabled={deletingCategoryId === c.id}
                          className="hover:text-destructive transition-colors"
                          aria-label={`Remove ${c.name}`}
                        >
                          {deletingCategoryId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </button>
                      )}
                    </span>
                  )
                })}
              </div>

              {isAdminOrFinance && organization?.subscription_tier !== "free" && (
                <form onSubmit={handleAddCategory} className="flex items-center gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Marketing"
                    maxLength={50}
                    className="h-9 max-w-xs"
                  />
                  <Button type="submit" size="sm" variant="outline" disabled={addingCategory || !newCategoryName.trim()} className="h-9 font-semibold bg-transparent">
                    {addingCategory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add
                  </Button>
                </form>
              )}

              {isAdminOrFinance && organization?.subscription_tier === "free" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-secondary/40 border border-border/40">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  Upgrade to Starter or higher to add your own categories.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base font-bold">Approval Workflow</CardTitle>
              <CardDescription className="text-xs">
                {isAdminOrFinance
                  ? "Set the thresholds and rules that decide how an expense request gets approved."
                  : "Your organization's approval rules. Contact an admin or finance user to change these."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium">Auto-approve under</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={!isAdminOrFinance}
                    value={workflowForm.auto_approve_under_amount}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, auto_approve_under_amount: e.target.valueAsNumber || 0 })}
                  />
                  <p className="text-[11px] text-muted-foreground">Requests below this amount skip approval entirely.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium">Receipt required above</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={!isAdminOrFinance}
                    value={workflowForm.receipt_required_above_amount}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, receipt_required_above_amount: e.target.valueAsNumber || 0 })}
                  />
                  <p className="text-[11px] text-muted-foreground">A receipt must be attached above this amount.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium">Finance review above</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={!isAdminOrFinance}
                    value={workflowForm.approval_threshold_amount}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, approval_threshold_amount: e.target.valueAsNumber || 0 })}
                  />
                  <p className="text-[11px] text-muted-foreground">Requests at/above this amount always get a finance review.</p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                {[
                  { key: "require_manager_approval" as const, label: "Manager approval required", description: "Requests that don't auto-approve need direct manager sign-off" },
                  { key: "require_finance_approval" as const, label: "Finance review required", description: "Finance reviews every request that doesn't auto-approve" },
                  { key: "require_receipts" as const, label: "Receipt requirement", description: "Enforce the receipt threshold set above" },
                ].map((rule) => (
                  <div key={rule.key} className="flex items-start justify-between p-4 rounded-xl bg-secondary/40 border border-border/40">
                    <div className="flex-1 mr-4">
                      <p className="text-sm font-medium">{rule.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                    </div>
                    <Switch
                      checked={workflowForm[rule.key]}
                      disabled={!isAdminOrFinance}
                      onCheckedChange={(checked) => setWorkflowForm({ ...workflowForm, [rule.key]: checked })}
                    />
                  </div>
                ))}
              </div>

              {isAdminOrFinance && (
                <div className="flex items-center gap-3">
                  <Button onClick={handleSaveWorkflow} disabled={savingWorkflow} className="font-semibold shadow-sm shadow-primary/20 w-fit">
                    <Save className="w-4 h-4 mr-2" /> {savingWorkflow ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-5">
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base font-bold">Notification Preferences</CardTitle>
              <CardDescription className="text-xs">Choose how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                {[
                  { key: "email_on_approve", label: "Approval Notifications", description: "Get notified when your request is approved" },
                  { key: "email_on_reject", label: "Rejection Notifications", description: "Get notified when your request is rejected" },
                  { key: "email_on_payment", label: "Payment Notifications", description: "Get notified when payment is processed" },
                  { key: "push_notifications", label: "Push Notifications", description: "Receive browser push notifications" },
                ].map((item) => (
                  <div key={item.key} className="flex items-start justify-between p-4 rounded-xl bg-secondary/40 border border-border/40">
                    <div className="flex-1 mr-4">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                    <Switch
                      checked={notifSettings[item.key as keyof typeof notifSettings] as boolean}
                      onCheckedChange={(checked) => {
                        setNotifSettings({ ...notifSettings, [item.key]: checked })
                        toast.success("Preference updated")
                      }}
                    />
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <Label className="text-[13px] font-medium">Email Digest Frequency</Label>
                <Select value={notifSettings.digest_frequency} onValueChange={(v) => setNotifSettings({ ...notifSettings, digest_frequency: v })}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Digest</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="mt-5">
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base font-bold">Theme</CardTitle>
              <CardDescription className="text-xs">Customize the look and feel of Monytar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 max-w-md">
                {[
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ].map((option) => {
                  const Icon = option.icon
                  const isActive = theme === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "flex flex-col items-center gap-2.5 p-5 rounded-xl border-2 transition-all duration-200",
                        isActive
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-secondary/50",
                      )}
                    >
                      <Icon className={cn("w-6 h-6", isActive ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-sm font-semibold", isActive ? "text-primary" : "text-muted-foreground")}>{option.label}</span>
                      {isActive && (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="mt-5 flex flex-col gap-5">
          {/* Current Plan */}
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <CardTitle className="font-heading text-base font-bold">Current Plan</CardTitle>
              </div>
              <CardDescription className="text-xs">Manage your subscription and billing</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex items-center justify-between p-5 rounded-xl bg-primary/5 border border-primary/15">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-lg">{currentPlan.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">Active</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{currentPlan.description}</p>
                  <p className="text-2xl font-extrabold mt-2 tracking-tight">
                    {currentPlan.priceInCents === 0 ? "Free" : `$${(currentPlan.priceInCents / 100).toFixed(0)}`}
                    {currentPlan.priceInCents > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /{currentPlan.interval === "year" ? "year" : "month"}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Plan Features</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {currentPlan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {isAdminOrFinance && (
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    onClick={handleManageBilling}
                    disabled={portalLoading}
                    className="font-semibold shadow-sm shadow-primary/20"
                  >
                    {portalLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening portal...</>
                    ) : (
                      <><CreditCard className="w-4 h-4 mr-2" /> Manage Billing</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Update payment methods, download invoices, or change your plan.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Plan */}
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base font-bold">Change Plan</CardTitle>
              <CardDescription className="text-xs">Upgrade or downgrade your subscription. Changes take effect immediately.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PRODUCTS.map((product) => {
                  const isCurrent = product.id === currentPlanId
                  const currentIdx = PRODUCTS.findIndex((p) => p.id === currentPlanId)
                  const thisIdx = PRODUCTS.findIndex((p) => p.id === product.id)
                  const isUpgrade = thisIdx > currentIdx
                  const isDowngrade = thisIdx < currentIdx

                  return (
                    <div
                      key={product.id}
                      className={cn(
                        "relative p-4 rounded-xl border transition-all duration-200",
                        isCurrent
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/20 hover:shadow-sm",
                      )}
                    >
                      {product.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider">
                          Popular
                        </span>
                      )}
                      <h4 className="font-heading font-bold text-sm">{product.name}</h4>
                      <p className="text-xl font-extrabold mt-1 tracking-tight">
                        {product.priceInCents === 0 ? "Free" : `$${(product.priceInCents / 100).toFixed(0)}`}
                        {product.priceInCents > 0 && (
                          <span className="text-xs font-normal text-muted-foreground">/{product.interval === "year" ? "yr" : "mo"}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                      <div className="mt-3">
                        {isCurrent ? (
                          <Button variant="outline" size="sm" className="w-full text-xs font-semibold bg-transparent" disabled>
                            Current Plan
                          </Button>
                        ) : product.tier === "enterprise" ? (
                          <Link href="/contact">
                            <Button variant="outline" size="sm" className="w-full text-xs font-semibold bg-transparent">
                              Contact Sales <ArrowUpRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            variant={isUpgrade ? "default" : "outline"}
                            size="sm"
                            disabled={!isAdminOrFinance || changingPlanId !== null}
                            onClick={() => handleChangePlan(product)}
                            className={cn("w-full text-xs font-semibold", !isUpgrade && "bg-transparent")}
                          >
                            {changingPlanId === product.id ? (
                              <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Working...</>
                            ) : (
                              <>
                                {isUpgrade ? "Upgrade" : isDowngrade ? "Downgrade" : "Select"}
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Cancel Subscription */}
          <Card className="border-destructive/30">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base font-bold text-destructive">Cancel Subscription</CardTitle>
              <CardDescription className="text-xs">
                Cancel your subscription. You will retain access to paid features until the end of your current billing period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={handleCancelSubscription}
                disabled={cancelLoading || !isAdminOrFinance || currentPlan.tier === "free"}
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold bg-transparent"
              >
                {cancelLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cancelling...</>
                ) : currentPlan.tier === "free" ? (
                  "Already on the Free plan"
                ) : (
                  "Cancel Subscription"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
