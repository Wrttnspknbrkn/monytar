// Regenerates the downloadable handbook (public/downloads/Monytar-Handbook.pdf) from the live /handbook page.
//
//   1. Start the app:            pnpm dev            (http://localhost:3000)
//   2. Run this script:          node scripts/export-handbook-pdf.mjs
//
// It opens /handbook in your installed Google Chrome, prints the page's "print edition"
// (fully expanded, no interactive parts) and saves it. Re-run it whenever the handbook
// copy or screenshots change, then commit the PDF.
import fs from "fs"
import path from "path"
import { chromium } from "@playwright/test"

const BASE = process.env.HANDBOOK_BASE_URL || "http://localhost:3000"
const OUT = path.join(process.cwd(), "public", "downloads", "Monytar-Handbook.pdf")

fs.mkdirSync(path.dirname(OUT), { recursive: true })

const browser = await chromium.launch({ channel: "chrome" })
const page = await browser.newPage()
await page.goto(`${BASE}/handbook`, { waitUntil: "networkidle", timeout: 120000 })
await page.emulateMedia({ media: "print" })
// Wait for every print-edition image and the display font before printing.
await page.evaluate(async () => {
  await document.fonts.ready
  await Promise.all(
    [...document.images].filter((i) => i.offsetParent !== null || getComputedStyle(i).display !== "none").map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r }))),
  )
})
await page.pdf({
  path: OUT,
  format: "A4",
  printBackground: true,
  margin: { top: "16mm", bottom: "18mm", left: "16mm", right: "16mm" },
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate:
    '<div style="width:100%;font-size:8px;color:#64748b;padding:0 16mm;display:flex;justify-content:space-between;font-family:Arial,sans-serif"><span>Monytar Handbook</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
})
await browser.close()
console.log(`Saved ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`)
