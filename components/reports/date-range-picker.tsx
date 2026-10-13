"use client"

import { useMemo, useState } from "react"
import type { DateRange } from "react-day-picker"
import { Calendar as CalendarIcon, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  RANGE_PRESETS,
  formatSpan,
  parseDateInput,
  resolveRange,
  toDateInput,
  type RangeSelection,
} from "@/lib/reports/date-range"

/**
 * Pick a period: a ready-made one (this month, last year, all time...) or any
 * dates you like, typed or chosen on a calendar. Nothing here caps how far back
 * you can go.
 */
export function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value: RangeSelection
  onChange: (next: RangeSelection) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const resolved = useMemo(() => resolveRange(value), [value])
  const today = useMemo(() => new Date(), [])
  const todayInput = toDateInput(today)

  // The custom dates being edited. Starts from whatever is currently selected.
  const [draft, setDraft] = useState<DateRange | undefined>(undefined)
  const [fromText, setFromText] = useState("")
  const [toText, setToText] = useState("")
  const [month, setMonth] = useState<Date>(today)

  // Start the custom dates from whatever is selected right now, each time the popover opens.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      const start = resolved.from ?? undefined
      const end = resolved.to ?? undefined
      setDraft(start ? { from: start, to: end } : undefined)
      setFromText(start ? toDateInput(start) : "")
      setToText(end ? toDateInput(end) : "")
      setMonth(start ?? today)
    }
    setOpen(next)
  }

  const setDates = (from: Date | undefined, to: Date | undefined) => {
    setDraft(from ? { from, to } : undefined)
    setFromText(from ? toDateInput(from) : "")
    setToText(to ? toDateInput(to) : "")
  }

  const onFromText = (text: string) => {
    setFromText(text)
    const d = parseDateInput(text)
    if (d) {
      setDraft((cur) => ({ from: d, to: cur?.to }))
      setMonth(d)
    }
  }
  const onToText = (text: string) => {
    setToText(text)
    const d = parseDateInput(text)
    if (d) setDraft((cur) => ({ from: cur?.from, to: d }) as DateRange)
  }

  const pickPreset = (id: (typeof RANGE_PRESETS)[number]["id"]) => {
    onChange({ kind: "preset", preset: id })
    setOpen(false)
  }

  const canApply = !!draft?.from
  const apply = () => {
    if (!draft?.from) return
    const to = draft.to ?? draft.from
    onChange({ kind: "custom", from: toDateInput(draft.from), to: toDateInput(to) })
    setOpen(false)
  }

  const summary = draft?.from ? formatSpan(draft.from, draft.to ?? draft.from) : "Choose a start date"
  const isCustom = value.kind === "custom"

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label={`Date range: ${resolved.label}`}
          title={resolved.dates}
          className={cn("h-9 min-w-[160px] max-w-full justify-between gap-2 bg-transparent px-3 text-sm font-medium", className)}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{resolved.label}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        collisionPadding={8}
        className="w-[min(92vw,34rem)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto p-0"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Ready-made periods */}
          <div className="border-b border-border/60 p-2 sm:w-44 sm:shrink-0 sm:border-b-0 sm:border-r">
            <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quick pick</p>
            <ul className="grid grid-cols-2 gap-0.5 sm:grid-cols-1">
              {RANGE_PRESETS.map((p) => {
                const active = value.kind === "preset" && value.preset === p.id
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => pickPreset(p.id)}
                      aria-pressed={active}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active && "bg-primary/10 font-semibold text-primary hover:bg-primary/10",
                      )}
                    >
                      {p.label}
                      {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Any dates you like */}
          <div className="flex flex-1 flex-col gap-3 p-3">
            <p className={cn("text-[11px] font-semibold uppercase tracking-wider", isCustom ? "text-primary" : "text-muted-foreground")}>
              Custom range
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="range-from" className="text-xs">From</Label>
                <Input id="range-from" type="date" max={todayInput} value={fromText} onChange={(e) => onFromText(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="range-to" className="text-xs">To</Label>
                <Input id="range-to" type="date" min={fromText || undefined} max={todayInput} value={toText} onChange={(e) => onToText(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Calendar
                mode="range"
                weekStartsOn={1}
                month={month}
                onMonthChange={setMonth}
                selected={draft}
                onSelect={(r) => setDates(r?.from, r?.to)}
                disabled={{ after: today }}
                className="mx-auto w-fit p-0"
              />
            </div>

            {/* Sticks to the bottom of the popover so Apply is always reachable on a small screen. */}
            <div className="sticky bottom-0 -mx-3 -mb-3 flex items-center justify-between gap-3 border-t border-border/60 bg-popover px-3 pb-3 pt-3">
              <p className="min-w-0 truncate text-xs text-muted-foreground" aria-live="polite">{summary}</p>
              <Button size="sm" className="shrink-0 font-semibold" disabled={!canApply} onClick={apply}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
