"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import type { DateRange } from "react-day-picker"
import { differenceInCalendarDays } from "date-fns"
import { AlertCircle, Calendar as CalendarIcon, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  RANGE_PRESETS,
  formatSpan,
  parseDateInput,
  resolveRange,
  toDateInput,
  type PresetId,
  type RangeSelection,
} from "@/lib/reports/date-range"

/** True while the viewport is at least `px` wide. SSR-safe, no effect needed. */
function useMinWidth(px: number): boolean {
  const query = `(min-width: ${px}px)`
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(query)
      mq.addEventListener("change", notify)
      return () => mq.removeEventListener("change", notify)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

const OLDEST_YEAR_OFFSET = 15

/**
 * Pick a period: a ready-made one (this month, last year, all time...) or any
 * dates you like, typed or chosen on a calendar. Nothing here caps how far back
 * you can go. A popover on larger screens, a bottom sheet on phones.
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
  const roomy = useMinWidth(640) // popover; below this a bottom sheet is easier to use
  const wide = useMinWidth(900) // two months side by side
  const resolved = useMemo(() => resolveRange(value), [value])
  const today = useMemo(() => new Date(), [])
  const todayInput = toDateInput(today)

  // What each quick pick covers right now, shown beside its name.
  const presetDates = useMemo(() => {
    const out = {} as Record<PresetId, string>
    for (const p of RANGE_PRESETS) out[p.id] = resolveRange({ kind: "preset", preset: p.id }, today).dates
    return out
  }, [today])

  // The custom dates being edited. Starts from whatever is selected right now.
  const [draft, setDraft] = useState<DateRange | undefined>(undefined)
  const [month, setMonth] = useState<Date>(today)

  const handleOpenChange = (next: boolean) => {
    if (next) {
      const from = resolved.from ?? undefined
      const to = resolved.to ?? undefined
      setDraft(from ? { from, to } : undefined)
      setMonth(from ?? today)
    }
    setOpen(next)
  }

  const onFromInput = (text: string) => {
    const d = parseDateInput(text)
    setDraft((cur) => (d ? { from: d, to: cur?.to } : cur?.to ? { from: undefined, to: cur.to } : undefined))
    if (d) setMonth(d)
  }
  const onToInput = (text: string) => {
    const d = parseDateInput(text)
    setDraft((cur) => ({ from: cur?.from, to: d ?? undefined }))
  }

  const pickPreset = (id: PresetId) => {
    onChange({ kind: "preset", preset: id })
    setOpen(false)
  }

  const from = draft?.from
  const to = draft?.to
  const backwards = !!from && !!to && from > to
  const canApply = !!from && !backwards
  const apply = () => {
    if (!from || backwards) return
    onChange({ kind: "custom", from: toDateInput(from), to: toDateInput(to ?? from) })
    setOpen(false)
  }

  const days = from ? differenceInCalendarDays(to ?? from, from) + 1 : 0
  const isCustom = value.kind === "custom"
  const sideBySide = roomy && wide

  const trigger = (onClick?: () => void) => (
    <Button
      variant="outline"
      aria-label={`Date range: ${resolved.label}`}
      title={resolved.dates}
      onClick={onClick}
      className={cn("h-9 min-w-[160px] max-w-full justify-between gap-2 bg-field px-3 text-sm font-medium", className)}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{resolved.label}</span>
      </span>
      <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
    </Button>
  )

  const panel = (
    <div className={cn("flex", sideBySide ? "flex-row" : "flex-col")}>
      {/* Ready-made periods */}
      <div className={cn("p-2", sideBySide ? "w-56 shrink-0 border-r border-border/60" : "border-b border-border/60")}>
        <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quick pick</p>
        <ul className={cn("grid gap-0.5", sideBySide ? "grid-cols-1" : "grid-cols-2")}>
          {RANGE_PRESETS.map((p) => {
            const active = value.kind === "preset" && value.preset === p.id
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => pickPreset(p.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    sideBySide ? "min-h-[2.4rem]" : "min-h-[2.25rem]",
                    active && "bg-primary/10 hover:bg-primary/10",
                  )}
                >
                  <span className="min-w-0">
                    <span className={cn("block truncate text-[13px] leading-snug", active ? "font-semibold text-primary" : "font-medium")}>
                      {p.label}
                    </span>
                    {sideBySide && (
                      <span className="block truncate text-[10.5px] leading-tight text-foreground/70">{presetDates[p.id]}</span>
                    )}
                  </span>
                  {active && <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={3} />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Any dates you like */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <p className={cn("text-[11px] font-semibold uppercase tracking-wider", isCustom ? "text-primary" : "text-muted-foreground")}>
            Custom range
          </p>
          {days > 0 && !backwards && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium tabular-nums text-foreground/75">
              {days} {days === 1 ? "day" : "days"}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="range-from" className="text-xs font-medium">From</Label>
            <Input
              id="range-from"
              type="date"
              max={todayInput}
              value={from ? toDateInput(from) : ""}
              onChange={(e) => onFromInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              aria-invalid={backwards || undefined}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="range-to" className="text-xs font-medium">To</Label>
            <Input
              id="range-to"
              type="date"
              max={todayInput}
              value={to ? toDateInput(to) : ""}
              onChange={(e) => onToInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              aria-invalid={backwards || undefined}
              className={cn("h-9 text-sm", backwards && "border-destructive")}
            />
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <Calendar
            mode="range"
            weekStartsOn={1}
            numberOfMonths={sideBySide ? 2 : 1}
            month={month}
            onMonthChange={setMonth}
            selected={draft}
            onSelect={setDraft}
            disabled={{ after: today }}
            captionLayout="dropdown-buttons"
            fromYear={today.getFullYear() - OLDEST_YEAR_OFFSET}
            toYear={today.getFullYear()}
            className="mx-auto w-fit"
          />
        </div>

        <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-popover px-4 py-3">
          <p className={cn("min-w-0 flex-1 truncate text-sm", backwards ? "text-destructive" : "text-muted-foreground")} aria-live="polite">
            {backwards ? (
              <span className="inline-flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> The end date is before the start date.
              </span>
            ) : from ? (
              <span className="font-medium text-foreground">{formatSpan(from, to ?? from)}</span>
            ) : (
              "Choose a start date"
            )}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="font-semibold" disabled={!canApply} onClick={apply}>
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  if (!roomy) {
    // Phones: a bottom sheet with room for the calendar, instead of a cramped popover.
    return (
      <>
        {trigger(() => handleOpenChange(true))}
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent side="bottom" className="max-h-[92dvh] gap-0 rounded-t-2xl bg-popover p-0">
            <SheetHeader className="border-b border-border/60 p-4 pr-12 text-left">
              <SheetTitle className="font-heading text-base">Choose a period</SheetTitle>
              <SheetDescription className="sr-only">Pick a ready-made period or enter your own start and end dates.</SheetDescription>
            </SheetHeader>
            {panel}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger()}</PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={8}
        className={cn(
          "max-h-[var(--radix-popover-content-available-height)] overflow-y-auto p-0 shadow-xl",
          wide ? "w-[min(94vw,50rem)]" : "w-[min(94vw,23rem)]",
        )}
      >
        {panel}
      </PopoverContent>
    </Popover>
  )
}
