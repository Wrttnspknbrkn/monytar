import type { EmailContent } from "@/lib/notifications/templates"

/**
 * Email transport via the Resend REST API (no SDK dependency — plain fetch).
 * Gracefully no-ops when RESEND_API_KEY is not configured so the app works in
 * demo mode and never crashes an approval/invite flow because email is down.
 */

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export type SendEmailResult = { sent: boolean; skipped?: boolean; id?: string; error?: string }

export async function sendEmail(to: string, content: EmailContent): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || "Monytar <onboarding@resend.dev>"

  if (!apiKey) {
    // Graceful no-op: log intent so it's observable in dev, but don't fail.
    console.log(`[email] skipped (RESEND_API_KEY not set) → to=${to} subject="${content.subject}"`)
    return { sent: false, skipped: true }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: content.subject,
        html: content.html,
        text: content.text,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      console.error(`[email] send failed (${res.status}): ${detail}`)
      return { sent: false, error: `Resend responded ${res.status}` }
    }

    const json = (await res.json().catch(() => ({}))) as { id?: string }
    return { sent: true, id: json.id }
  } catch (err) {
    console.error("[email] send threw:", err)
    return { sent: false, error: err instanceof Error ? err.message : "unknown error" }
  }
}
