import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * Guards the form colours in the dark theme. Fields must be findable (their edge at
 * least 3:1 against the page and cards, WCAG 1.4.11) and text/links readable (4.5:1).
 * Reads the real tokens from globals.css, so a casual tweak can't quietly break them.
 */

const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8").replace(/\r\n/g, "\n")

function block(selector: RegExp): string {
  const m = css.match(selector)
  if (!m) throw new Error(`no block for ${selector}`)
  const start = css.indexOf("{", m.index!)
  let depth = 0
  for (let i = start; i < css.length; i++) {
    if (css[i] === "{") depth++
    if (css[i] === "}" && --depth === 0) return css.slice(start + 1, i)
  }
  throw new Error("unbalanced block")
}

function tokens(body: string): Record<string, [number, number, number]> {
  const out: Record<string, [number, number, number]> = {}
  for (const m of body.matchAll(/--([a-z-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/g)) {
    out[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])]
  }
  return out
}

function rgb([h, s, l]: [number, number, number]): [number, number, number] {
  const sat = s / 100
  const lig = l / 100
  const a = sat * Math.min(lig, 1 - lig)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return lig - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))
  }
  return [f(0) * 255, f(8) * 255, f(4) * 255]
}

function luminance(c: [number, number, number]): number {
  const [r, g, b] = c.map((v) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(rgb(a)), luminance(rgb(b))].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const dark = tokens(block(/^\s*\.dark\s*\{/m))

describe("dark theme form colours", () => {
  it("defines the tokens the form controls rely on", () => {
    for (const t of ["background", "card", "input", "field", "primary-ink", "muted-foreground", "foreground"]) {
      expect(dark[t], `--${t} missing from .dark`).toBeTruthy()
    }
  })

  it("field edges stand out from the page and from cards (3:1)", () => {
    expect(contrast(dark.input, dark.background)).toBeGreaterThanOrEqual(3)
    expect(contrast(dark.input, dark.card)).toBeGreaterThanOrEqual(3)
  })

  it("text typed into a field, and its placeholder, are readable", () => {
    expect(contrast(dark.foreground, dark.field)).toBeGreaterThanOrEqual(7)
    expect(contrast(dark["muted-foreground"], dark.field)).toBeGreaterThanOrEqual(4.5)
  })

  it("link blue is readable on the page and on cards (4.5:1)", () => {
    expect(contrast(dark["primary-ink"], dark.background)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(dark["primary-ink"], dark.card)).toBeGreaterThanOrEqual(4.5)
  })

  it("a field is lighter than the page it sits on, so it reads as a field", () => {
    expect(luminance(rgb(dark.field))).toBeGreaterThan(luminance(rgb(dark.background)))
  })
})
