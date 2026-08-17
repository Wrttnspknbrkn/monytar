import type { SupabaseClient } from "@supabase/supabase-js"
import type { NotificationType } from "@/lib/types"
import type { EmailContent } from "@/lib/notifications/templates"
import { sendEmail } from "@/lib/notifications/email"

/**
 * Central notification service. Writes an in-app notification row and, when an
 * email is supplied, sends it best-effort. Neither failure path throws — a
 * notification problem must never break the underlying business action.
 */

export type NotifyInput = {
  organizationId: string
  userId: string
  type: NotificationType
  title: string
  message: string
  relatedEntityType?: string
  relatedEntityId?: string
  // Optional email delivery (recipient address + rendered content).
  email?: { to: string; content: EmailContent }
}

export async function notify(supabase: SupabaseClient, input: NotifyInput): Promise<void> {
  // 1) In-app notification row.
  try {
    const { error } = await supabase.from("notifications").insert({
      organization_id: input.organizationId,
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      related_entity_type: input.relatedEntityType,
      related_entity_id: input.relatedEntityId,
    })
    if (error) console.error("[notify] in-app insert failed:", error.message)
  } catch (err) {
    console.error("[notify] in-app insert threw:", err)
  }

  // 2) Best-effort email (gracefully no-ops when unconfigured).
  if (input.email) {
    try {
      await sendEmail(input.email.to, input.email.content)
    } catch (err) {
      console.error("[notify] email threw:", err)
    }
  }
}
