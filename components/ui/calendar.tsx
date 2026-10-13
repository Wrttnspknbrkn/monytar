'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

/**
 * Month calendar. Works for a single day or a range: a range is drawn as one soft
 * band with solid ends, and every colour comes from the theme tokens so it reads in
 * light and dark. Pass captionLayout="dropdown-buttons" (with fromYear/toYear) for
 * month and year pickers, so far-away dates are two clicks, not fifty.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-0', className)}
      classNames={{
        months: 'flex flex-col gap-6 sm:flex-row',
        month: 'space-y-3',
        caption: 'relative flex h-9 items-center justify-center',
        caption_label: 'flex items-center gap-1 text-sm font-semibold',
        caption_dropdowns: 'flex items-center gap-1',
        dropdown_month:
          'relative inline-flex items-center rounded-md px-2 py-1 transition-colors hover:bg-secondary focus-within:ring-2 focus-within:ring-ring',
        dropdown_year:
          'relative inline-flex items-center rounded-md px-2 py-1 transition-colors hover:bg-secondary focus-within:ring-2 focus-within:ring-ring',
        dropdown: 'absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0',
        dropdown_icon: 'h-3.5 w-3.5 opacity-60',
        vhidden: 'sr-only',
        nav: 'flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-8 w-8 p-0 text-muted-foreground hover:text-foreground',
        ),
        nav_button_previous: 'absolute left-0',
        nav_button_next: 'absolute right-0',
        table: 'w-full border-collapse',
        head_row: 'flex',
        head_cell: 'w-9 text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground',
        row: 'mt-1 flex w-full',
        cell: cn(
          'relative h-9 w-9 p-0 text-center text-sm focus-within:z-20',
          // The soft band behind a selected range; solid ends sit on top of it.
          '[&:has([aria-selected])]:bg-primary/15',
          '[&:has(.day-range-start)]:rounded-l-md [&:has(.day-range-end)]:rounded-r-md',
          'first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md',
        ),
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 rounded-md p-0 font-normal aria-selected:opacity-100',
        ),
        day_range_start: 'day-range-start',
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_range_middle:
          'rounded-none bg-transparent text-foreground hover:bg-primary/20 aria-selected:bg-transparent aria-selected:text-foreground',
        day_today: 'font-bold text-primary-ink ring-1 ring-inset ring-primary/50',
        day_outside: 'text-muted-foreground opacity-50',
        day_disabled: 'text-muted-foreground opacity-35',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
        IconDropdown: () => <ChevronDown className="h-3.5 w-3.5 opacity-60" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
