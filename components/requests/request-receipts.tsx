"use client"

import useSWR from "swr"
import { FileText, ImageIcon, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isSupabaseConfigured } from "@/lib/supabase/config"
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
}

export function RequestReceipts({ requestId, fallbackReceipts = [] }: RequestReceiptsProps) {
  const connected = isSupabaseConfigured()

  // Only hit the API when a real backend is connected.
  const { data } = useSWR<{ receipts?: ReceiptWithUrl[] }>(
    connected ? `/api/receipts?request_id=${requestId}` : null,
    fetcher,
  )

  const receipts: ReceiptWithUrl[] = connected ? data?.receipts ?? [] : fallbackReceipts

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
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
