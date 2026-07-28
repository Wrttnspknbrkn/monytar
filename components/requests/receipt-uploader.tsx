"use client"

import { useRef } from "react"
import { Upload, X, FileText, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { validateReceiptFile, ALLOWED_RECEIPT_TYPES } from "@/lib/receipts/client"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface ReceiptUploaderProps {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
}

export function ReceiptUploader({ files, onChange, disabled }: ReceiptUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const incoming = Array.from(fileList)
    const valid: File[] = []

    for (const file of incoming) {
      const error = validateReceiptFile(file)
      if (error) {
        toast.error(`${file.name}: ${error}`)
        continue
      }
      // Skip duplicates by name + size.
      if (files.some((f) => f.name === file.name && f.size === file.size)) continue
      valid.push(file)
    }

    if (valid.length > 0) {
      onChange([...files, ...valid])
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_RECEIPT_TYPES.join(",")}
        multiple
        className="sr-only"
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = "" // allow re-selecting the same file
        }}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="w-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 hover:bg-primary/[0.02] transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary mb-3 group-hover:bg-primary/10 transition-colors">
          <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </span>
        <span className="text-sm font-medium">Click to upload receipts</span>
        <span className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, WEBP, HEIC up to 10MB</span>
      </button>

      {files.length > 0 && (
        <ul className="flex flex-col gap-2 mt-4">
          {files.map((file, i) => {
            const isImage = file.type.startsWith("image/")
            return (
              <li
                key={`${file.name}-${file.size}-${i}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/40"
              >
                {isImage ? (
                  <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onChange(files.filter((_, j) => j !== i))}
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="sr-only">Remove {file.name}</span>
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
