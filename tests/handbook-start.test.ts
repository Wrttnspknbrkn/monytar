import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { START_PATHS } from "@/components/handbook/handbook-content"
import helpMarkers from "@/components/help/markers.json"
import startMarkers from "@/components/handbook/start-markers.json"

type Manifest = Record<string, { width: number; height: number; markers: { n: number }[] }>
const manifest = { ...(helpMarkers as Manifest), ...(startMarkers as Manifest) }

describe("handbook getting-started paths", () => {
  it("has both paths, each with steps", () => {
    expect(START_PATHS.map((p) => p.id)).toEqual(["company", "invited"])
    for (const p of START_PATHS) expect(p.steps.length).toBeGreaterThanOrEqual(4)
  })

  for (const p of START_PATHS) {
    it.each(p.steps.map((s) => [s.title, s] as const))(`${p.id}: "%s" has a screenshot and a real marker`, (_t, step) => {
      expect(existsSync(join(process.cwd(), "public", "images", "help", `${step.image}.png`))).toBe(true)
      const shot = manifest[step.image]
      expect(shot, `no marker data for ${step.image}`).toBeTruthy()
      expect(shot.markers.some((m) => m.n === step.marker)).toBe(true)
    })
  }
})
