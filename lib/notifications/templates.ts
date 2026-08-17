/**
 * Pure email template builders. No I/O — returns subject + HTML + text so they
 * can be unit-tested and reused by any transport (Resend today, others later).
 */

export type EmailContent = { subject: string; html: string; text: string }

const BRAND = "Monytar"

function escapeHTML(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value)
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Wraps body HTML in a minimal, email-client-safe shell. */
function shell(title: string, bodyHTML: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHTML(title)}</title></head>
<body style="margin:0;background:#f4f4f5;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
      <tr><td style="padding:20px 28px;border-bottom:1px solid #e4e4e7;font-weight:700;font-size:16px;">${escapeHTML(BRAND)}</td></tr>
      <tr><td style="padding:28px;">${bodyHTML}</td></tr>
      <tr><td style="padding:18px 28px;border-top:1px solid #e4e4e7;color:#a1a1aa;font-size:12px;">You are receiving this because you have an account on ${escapeHTML(BRAND)}.</td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

function button(url: string, label: string): string {
  return `<a href="${escapeHTML(url)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600;font-size:14px;">${escapeHTML(label)}</a>`
}

export function requestApprovedEmail(opts: {
  recipientName?: string
  requestNumber: string
  amount: string
  approverName?: string
  url?: string
}): EmailContent {
  const name = opts.recipientName ? `Hi ${opts.recipientName},` : "Hi,"
  const subject = `Approved: ${opts.requestNumber} (${opts.amount})`
  const body = `<p style="margin:0 0 12px;">${escapeHTML(name)}</p>
    <p style="margin:0 0 16px;">Your expense request <strong>${escapeHTML(opts.requestNumber)}</strong> for <strong>${escapeHTML(opts.amount)}</strong> has been approved${opts.approverName ? ` by ${escapeHTML(opts.approverName)}` : ""}.</p>
    ${opts.url ? `<p style="margin:0 0 8px;">${button(opts.url, "View request")}</p>` : ""}`
  const text = `${name}\n\nYour expense request ${opts.requestNumber} for ${opts.amount} has been approved${opts.approverName ? ` by ${opts.approverName}` : ""}.${opts.url ? `\n\nView: ${opts.url}` : ""}`
  return { subject, html: shell(subject, body), text }
}

export function requestRejectedEmail(opts: {
  recipientName?: string
  requestNumber: string
  amount: string
  reason: string
  url?: string
}): EmailContent {
  const name = opts.recipientName ? `Hi ${opts.recipientName},` : "Hi,"
  const subject = `Update on ${opts.requestNumber}`
  const body = `<p style="margin:0 0 12px;">${escapeHTML(name)}</p>
    <p style="margin:0 0 12px;">Your expense request <strong>${escapeHTML(opts.requestNumber)}</strong> for <strong>${escapeHTML(opts.amount)}</strong> was not approved.</p>
    <p style="margin:0 0 16px;padding:12px 14px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca;"><strong>Reason:</strong> ${escapeHTML(opts.reason)}</p>
    ${opts.url ? `<p style="margin:0 0 8px;">${button(opts.url, "Review & resubmit")}</p>` : ""}`
  const text = `${name}\n\nYour expense request ${opts.requestNumber} for ${opts.amount} was not approved.\n\nReason: ${opts.reason}${opts.url ? `\n\nReview: ${opts.url}` : ""}`
  return { subject, html: shell(subject, body), text }
}

export function invitationEmail(opts: {
  organizationName: string
  inviterName?: string
  role: string
  url: string
}): EmailContent {
  const subject = `You have been invited to join ${opts.organizationName} on ${BRAND}`
  const body = `<p style="margin:0 0 12px;">Hi,</p>
    <p style="margin:0 0 16px;">${opts.inviterName ? `${escapeHTML(opts.inviterName)} has ` : "You have been "}invited you to join <strong>${escapeHTML(opts.organizationName)}</strong> as a <strong>${escapeHTML(opts.role)}</strong>.</p>
    <p style="margin:0 0 16px;">${button(opts.url, "Accept invitation")}</p>
    <p style="margin:0;color:#71717a;font-size:13px;">This invitation expires in 7 days.</p>`
  const text = `You have been invited to join ${opts.organizationName} as a ${opts.role}.\n\nAccept: ${opts.url}\n\nThis invitation expires in 7 days.`
  return { subject, html: shell(subject, body), text }
}

export function budgetAlertEmail(opts: {
  recipientName?: string
  departmentName: string
  percentage: number
  spend: string
  budget: string
  url?: string
}): EmailContent {
  const name = opts.recipientName ? `Hi ${opts.recipientName},` : "Hi,"
  const over = opts.percentage >= 100
  const subject = `${over ? "Over budget" : "Budget alert"}: ${opts.departmentName} at ${opts.percentage}%`
  const body = `<p style="margin:0 0 12px;">${escapeHTML(name)}</p>
    <p style="margin:0 0 16px;">The <strong>${escapeHTML(opts.departmentName)}</strong> department is at <strong>${opts.percentage}%</strong> of its budget (${escapeHTML(opts.spend)} of ${escapeHTML(opts.budget)}).</p>
    ${opts.url ? `<p style="margin:0 0 8px;">${button(opts.url, "View budgets")}</p>` : ""}`
  const text = `${name}\n\nThe ${opts.departmentName} department is at ${opts.percentage}% of its budget (${opts.spend} of ${opts.budget}).${opts.url ? `\n\nView: ${opts.url}` : ""}`
  return { subject, html: shell(subject, body), text }
}
