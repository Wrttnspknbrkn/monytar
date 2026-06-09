import type { DemoLead, DemoLeadRole } from "@/lib/types"

const STORAGE_KEY = "monytar_demo_leads"
const SESSION_KEY = "monytar_demo_session"

export interface DemoLeadInput {
  full_name: string
  email: string
  company_name?: string
  phone?: string
  entry_role: DemoLeadRole
}

export interface DemoSession {
  lead_id: string
  full_name: string
  email: string
  entry_role: DemoLeadRole
  started_at: string
}

/**
 * Collect lightweight, client-available context for a demo lead.
 * Nothing here requires special permissions. IP and country are
 * resolved server side where legally permitted.
 */
export function collectLeadContext(): Partial<DemoLead> {
  if (typeof window === "undefined") return {}

  const ua = navigator.userAgent
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua)
  const isTablet = /iPad|Tablet/i.test(ua)
  const device = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop"

  let browser = "Unknown"
  if (/Edg\//.test(ua)) browser = "Edge"
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = "Chrome"
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = "Safari"
  else if (/Firefox\//.test(ua)) browser = "Firefox"

  const params = new URLSearchParams(window.location.search)

  return {
    device,
    browser,
    referrer: document.referrer ? new URL(document.referrer).hostname : "Direct",
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
  }
}

function readLocalLeads(): DemoLead[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DemoLead[]) : []
  } catch {
    return []
  }
}

function writeLocalLeads(leads: DemoLead[]): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads))
  } catch {
    /* storage may be unavailable; demo still proceeds */
  }
}

/**
 * Capture a demo lead. Attempts to persist to the backend, and always
 * mirrors to localStorage so the Demo Leads admin view works in the
 * in-memory sandbox even without a configured database.
 */
export async function captureDemoLead(input: DemoLeadInput): Promise<DemoSession> {
  const context = collectLeadContext()
  const now = new Date().toISOString()

  const lead: DemoLead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    full_name: input.full_name.trim(),
    email: input.email.trim().toLowerCase(),
    company_name: input.company_name?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    entry_role: input.entry_role,
    converted: false,
    created_at: now,
    ...context,
  }

  // Best effort backend persistence (no-op in pure demo mode).
  try {
    const res = await fetch("/api/demo-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    })
    if (res.ok) {
      const data = await res.json().catch(() => null)
      if (data?.lead?.id) lead.id = data.lead.id
    }
  } catch {
    /* offline / demo mode: localStorage mirror below is the source of truth */
  }

  const leads = readLocalLeads()
  leads.unshift(lead)
  writeLocalLeads(leads.slice(0, 500))

  const session: DemoSession = {
    lead_id: lead.id,
    full_name: lead.full_name,
    email: lead.email,
    entry_role: lead.entry_role,
    started_at: now,
  }

  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* ignore */
  }

  return session
}

export function getDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as DemoSession) : null
  } catch {
    return null
  }
}

export function clearDemoSession(): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Read demo leads for the admin view. Merges any backend leads with the
 * localStorage mirror, de-duplicating by id.
 */
export async function listDemoLeads(): Promise<DemoLead[]> {
  let remote: DemoLead[] = []
  try {
    const res = await fetch("/api/demo-leads", { cache: "no-store" })
    if (res.ok) {
      const data = await res.json().catch(() => null)
      if (Array.isArray(data?.leads)) remote = data.leads as DemoLead[]
    }
  } catch {
    /* demo mode */
  }

  const local = readLocalLeads()
  const byId = new Map<string, DemoLead>()
  for (const lead of [...remote, ...local]) {
    if (!byId.has(lead.id)) byId.set(lead.id, lead)
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}

export function leadsToCsv(leads: DemoLead[]): string {
  const headers = [
    "Name",
    "Email",
    "Company",
    "Phone",
    "Entry Role",
    "Country",
    "Device",
    "Browser",
    "Referrer",
    "Campaign",
    "Converted",
    "Created At",
  ]

  const escape = (value: string | undefined): string => {
    const v = value ?? ""
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`
    return v
  }

  const rows = leads.map((l) =>
    [
      l.full_name,
      l.email,
      l.company_name,
      l.phone,
      l.entry_role,
      l.country,
      l.device,
      l.browser,
      l.referrer,
      l.utm_campaign || l.utm_source,
      l.converted ? "Yes" : "No",
      new Date(l.created_at).toLocaleString(),
    ]
      .map(escape)
      .join(","),
  )

  return [headers.join(","), ...rows].join("\n")
}
