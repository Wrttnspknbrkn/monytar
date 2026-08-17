"use client"

/**
 * Browser-only download / print helpers for report exports. Kept separate from
 * the pure builders in `export.ts` so the builders stay unit-testable.
 */

/** Triggers a client-side download of a text blob. */
export function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadCSV(csv: string, filename: string) {
  downloadTextFile(csv, filename, "text/csv;charset=utf-8")
}

/**
 * Opens the printable HTML report in a hidden iframe and invokes the browser's
 * print dialog (users choose "Save as PDF"). Falls back to a downloadable .html
 * file if popup/print is unavailable.
 */
export function downloadHTMLReport(html: string, baseName: string) {
  try {
    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "0"
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) throw new Error("iframe document unavailable")
    doc.open()
    doc.write(html)
    doc.close()

    const cleanup = () => {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
      }, 500)
    }

    iframe.onload = () => {
      const win = iframe.contentWindow
      if (!win) {
        cleanup()
        return
      }
      win.focus()
      win.print()
      // Best-effort cleanup after the print dialog is dismissed.
      if ("onafterprint" in win) {
        win.onafterprint = cleanup
      } else {
        cleanup()
      }
    }
  } catch {
    // Fallback: download the raw HTML so the user can open + print manually.
    downloadTextFile(html, `${baseName}.html`, "text/html;charset=utf-8")
  }
}
