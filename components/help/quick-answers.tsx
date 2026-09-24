"use client"

import { useMemo, useState } from "react"
import { Search, SearchX, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FAQS, GLOSSARY, TASKS } from "./guide-data"

/** Type a word, get the short answer. Matches the question, the answer and related words. */
export function QuickAnswers({ onOpenTask }: { onOpenTask: (taskId: string) => void }) {
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return FAQS
    return FAQS.filter((f) => {
      const hay = `${f.q} ${f.a} ${f.keywords}`.toLowerCase()
      return tokens.every((t) => hay.includes(t))
    })
  }, [query])

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search quick answers"
          placeholder="Type a word — receipt, rejected, password…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 pl-9 pr-9"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
          <SearchX className="h-7 w-7 text-muted-foreground/50" />
          <p className="text-sm font-medium">No answer for “{query}”</p>
          <p className="text-xs text-muted-foreground">Try another word, or ask an admin in your organization.</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="rounded-2xl border border-border/60 bg-card px-4">
          {results.map((f) => {
            const task = f.taskId ? TASKS.find((t) => t.id === f.taskId) : undefined
            return (
              <AccordionItem key={f.q} value={f.q} className="last:border-b-0">
                <AccordionTrigger className="text-left text-sm font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
                  <p>{f.a}</p>
                  {task && (
                    <Button variant="outline" size="sm" className="bg-transparent" onClick={() => onOpenTask(task.id)}>
                      Show me how
                    </Button>
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Words you&apos;ll see — tap one</p>
        <div className="flex flex-wrap gap-2">
          {GLOSSARY.map((g) => (
            <Popover key={g.term}>
              <PopoverTrigger asChild>
                <button type="button" className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 data-[state=open]:border-primary data-[state=open]:bg-primary/5">
                  {g.term}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 text-sm" collisionPadding={12}>
                <p className="font-heading font-bold">{g.term}</p>
                <p className="mt-1 text-muted-foreground">{g.def}</p>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </div>
    </div>
  )
}
