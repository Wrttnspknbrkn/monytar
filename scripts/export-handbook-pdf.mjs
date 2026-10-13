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
// Wait for the display font and every print-edition image, but never forever: an image that
// can't load must not hang the export. Anything still missing after 20s is reported.
const stillLoading = await page.evaluate(async () => {
  await document.fonts.ready
  const imgs = [...document.images].filter((i) => i.getClientRects().length > 0)
  const pending = imgs.filter((i) => !i.complete)
  const timeout = new Promise((r) => setTimeout(r, 20000))
  await Promise.race([
    Promise.all(pending.map((i) => new Promise((r) => { i.onload = i.onerror = r }))),
    timeout,
  ])
  return imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute("src"))
})
if (stillLoading.length) console.warn("Warning: these images did not load:", stillLoading.join(", "))
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
