"use client"

import { useState } from "react"
import { User, Building2, Bell, Palette, Save, Check, Moon, Sun, Monitor, DollarSign } from "lucide-react"
import { useStore, organization } from "@/lib/store"
import { getRoleLabel, formatCurrency, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { useTheme } from "next-themes"

const SUPPORTED_CURRENCIES = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "\u20AC" },
  { code: "GBP", label: "British Pound", symbol: "\u00A3" },
  { code: "CAD", label: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "JPY", label: "Japanese Yen", symbol: "\u00A5" },
  { code: "CHF", label: "Swiss Franc", symbol: "CHF" },
  { code: "NGN", label: "Nigerian Naira", symbol: "\u20A6" },
  { code: "GHS", label: "Ghanaian Cedi", symbol: "GH\u20B5" },
  { code: "KES", label: "Kenyan Shilling", symbol: "KSh" },
  { code: "ZAR", label: "South African Rand", symbol: "R" },
  { code: "INR", label: "Indian Rupee", symbol: "\u20B9" },
  { code: "BRL", label: "Brazilian Real", symbol: "R$" },
  { code: "MXN", label: "Mexican Peso", symbol: "MX$" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$" },
  { code: "AED", label: "UAE Dirham", symbol: "AED" },
]

export default function SettingsPage() {
  const { currentUser, departments, updateUser, orgSettings, updateOrgSettings } = useStore()
  const { theme, setTheme } = useTheme()
  const dept = departments.find((d) => d.id === currentUser.department_id)
  const [profileForm, setProfileForm] = useState({
    full_name: currentUser.full_name,
    email: currentUser.email,
  })
  const [saved, setSaved] = useState(false)
  const [currencySaved, setCurrencySaved] = useState(false)
  const [notifSettings, setNotifSettings] = useState({
    email_on_approve: true,
    email_on_reject: true,
    email_on_payment: true,
    push_notifications: false,
    digest_frequency: "daily",
  })

  function handleSaveProfile() {
    updateUser(currentUser.id, { full_name: profileForm.full_name, email: profileForm.email })
    setSaved(true)
    toast.success("Profile updated successfully")
    setTimeout(() => setSaved(false), 2000)
  }

  function handleCurrencyChange(code: string) {
    updateOrgSettings({ default_currency: code })
    setCurrencySaved(true)
    toast.success(`Currency changed to ${code}`)
    setTimeout(() => setCurrencySaved(false), 2000)
  }

  const isAdminOrFinance = currentUser.role === "admin" || currentUser.role === "finance"

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
                    {currentUser.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-heading font-bold">{currentUser.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider",
                      currentUser.role === "admin" ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800" :
                      currentUser.role === "finance" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" :
                      currentUser.role === "manager" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" :
                      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                    )}>
                      {getRoleLabel(currentUser.role)}
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
                <Button onClick={handleSaveProfile} className="font-semibold shadow-sm shadow-primary/20">
                  {saved ? <><Check className="w-4 h-4 mr-2" /> Saved</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
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
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium">Current Password</Label>
                  <Input type="password" placeholder="Enter current password" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium">New Password</Label>
                  <Input type="password" placeholder="Enter new password" />
                </div>
              </div>
              <Button variant="outline" className="w-fit bg-transparent font-semibold" onClick={() => toast.info("Password change is demo only")}>
                Update Password
              </Button>
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
                  { label: "Organization", value: organization.name },
                  { label: "Slug", value: organization.slug },
                  { label: "Plan", value: organization.subscription_tier.charAt(0).toUpperCase() + organization.subscription_tier.slice(1) },
                  { label: "Auto Approve Threshold", value: formatCurrency(orgSettings.auto_approve_under_amount || 0, orgSettings.default_currency) },
                  { label: "Require Receipts Above", value: formatCurrency(orgSettings.receipt_required_above_amount, orgSettings.default_currency) },
                  { label: "Fiscal Year Start", value: orgSettings.fiscal_year_start },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
                    <p className="text-sm font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
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
                    value={orgSettings.default_currency}
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
                            <span>{c.label}</span>
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
                  <span className="font-mono font-semibold">{formatCurrency(1234.56, orgSettings.default_currency)}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base font-bold">Approval Workflow</CardTitle>
              <CardDescription className="text-xs">Default approval rules for expense requests</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                {[
                  { label: "Auto-approve expenses under threshold", description: `Requests under ${formatCurrency(orgSettings.auto_approve_under_amount || 0, orgSettings.default_currency)} are approved automatically`, enabled: true },
                  { label: "Manager approval required", description: "All requests require direct manager approval", enabled: orgSettings.require_manager_approval },
                  { label: "Finance review for large amounts", description: "Finance team reviews requests above department thresholds", enabled: orgSettings.require_finance_approval },
                  { label: "Receipt requirement", description: `Receipts required for expenses over ${formatCurrency(orgSettings.receipt_required_above_amount, orgSettings.default_currency)}`, enabled: orgSettings.require_receipts },
                ].map((rule) => (
                  <div key={rule.label} className="flex items-start justify-between p-4 rounded-xl bg-secondary/40 border border-border/40">
                    <div className="flex-1 mr-4">
                      <p className="text-sm font-medium">{rule.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                    </div>
                    <Switch checked={rule.enabled} onCheckedChange={() => toast.info("Workflow settings will be editable with Supabase integration")} />
                  </div>
                ))}
              </div>
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
              <CardDescription className="text-xs">Customize the look and feel of SpendWell</CardDescription>
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
      </Tabs>
    </div>
  )
}
