"use client"

import { useState } from "react"
import useSWR from "swr"
import { FileText, ImageIcon, ExternalLink, Trash2, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { useAuth } from "@/lib/providers"
import { toast } from "sonner"
import type { Receipt } from "@/lib/types"

type ReceiptWithUrl = Receipt & { signed_url?: string | null }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatKb(bytes?: number): string {
  const kb = (bytes || 0) / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

interface RequestReceiptsProps {
  requestId: string
  fallbackReceipts?: Receipt[]
  /** The request's status — receipts stop being deletable once it's left draft/pending, matching the audit trail expectation. */
  requestStatus?: string
}

export function RequestReceipts({ requestId, fallbackReceipts = [], requestStatus }: RequestReceiptsProps) {
  const connected = isSupabaseConfigured()
  const { dbUser } = useAuth()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Only hit the API when a real backend is connected.
  const { data, mutate } = useSWR<{ receipts?: ReceiptWithUrl[] }>(
    connected ? `/api/receipts?request_id=${requestId}` : null,
    fetcher,
  )

  const receipts: ReceiptWithUrl[] = connected ? data?.receipts ?? [] : fallbackReceipts

  // Once a request has left draft/pending (approved, rejected, paid), its
  // receipts are the audit record — editable while the request is still
  // being assembled or under review, frozen after a decision is made.
  const canDelete = connected && (requestStatus === "draft" || requestStatus === "pending" || !requestStatus)

  async function handleDelete(receiptId: string, fileName: string) {
    if (!window.confirm(`Remove "${fileName}"? This can't be undone.`)) return
    setDeletingId(receiptId)
    try {
      const res = await fetch(`/api/receipts/${receiptId}`, { method: "DELETE" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error || "Couldn't remove receipt")
        return
      }
      mutate()
    } catch {
      toast.error("Couldn't remove receipt. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  if (receipts.length === 0) return null

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base font-bold">
          Receipts <span className="text-muted-foreground font-medium">({receipts.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {receipts.map((receipt) => {
            const isImage = (receipt.file_type || "").startsWith("image/")
            const href = receipt.signed_url
            const Icon = isImage ? ImageIcon : FileText
            return (
              <li
                key={receipt.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/40"
              >
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{receipt.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {receipt.file_type || "file"} &middot; {formatKb(receipt.file_size)}
                  </p>
                </div>
                {href && (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline shrink-0"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {canDelete && (receipt.uploaded_by === dbUser?.id || dbUser?.role === "admin" || dbUser?.role === "finance") && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={deletingId === receipt.id}
                    onClick={() => handleDelete(receipt.id, receipt.file_name)}
                    aria-label={`Remove ${receipt.file_name}`}
                  >
                    {deletingId === receipt.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
