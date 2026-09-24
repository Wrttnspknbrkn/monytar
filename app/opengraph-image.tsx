import { readFile } from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"

// The picture shown when a Monytar link is shared (WhatsApp, LinkedIn, Slack, X, ...).
// 1200x630 is the size those apps expect.
export const runtime = "nodejs"
export const alt = "Monytar - Modern Expense Management Platform"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  const shot = await readFile(path.join(process.cwd(), "public", "images", "dashboard-preview.png"))
  const src = `data:image/png;base64,${shot.toString("base64")}`

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #0ea5e9 130%)", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 560, padding: "0 0 0 72px" }}>
          <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, textTransform: "uppercase", opacity: 0.75 }}>Monytar</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 68, lineHeight: 1.05, fontWeight: 700 }}>Expenses, approved and paid.</div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 28, lineHeight: 1.35, opacity: 0.85 }}>Requests, approvals, budgets and reports in one place.</div>
        </div>
        <div style={{ display: "flex", position: "absolute", left: 640, top: 96, width: 640, height: 440, borderRadius: 24, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.4)", border: "6px solid rgba(255,255,255,0.35)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={src} width={1000} height={562} style={{ objectFit: "cover", objectPosition: "left top" }} />
        </div>
      </div>
    ),
    size,
  )
}
