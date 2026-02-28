import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
  secondaryLabel?: string
  onSecondary?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  secondaryLabel,
  onSecondary,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary mb-5">
        <Icon className="w-7 h-7 text-muted-foreground/50" />
      </div>
      <h3 className="font-heading font-bold text-lg mb-1.5 text-balance">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm text-balance leading-relaxed">{description}</p>
      {(actionLabel || secondaryLabel) && (
        <div className="flex items-center gap-3 mt-6">
          {secondaryLabel && onSecondary && (
            <Button variant="outline" className="bg-transparent font-semibold" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
          {actionLabel && actionHref && (
            <a href={actionHref}>
              <Button className="font-semibold shadow-sm shadow-primary/25">{actionLabel}</Button>
            </a>
          )}
          {actionLabel && onAction && !actionHref && (
            <Button className="font-semibold shadow-sm shadow-primary/25" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
