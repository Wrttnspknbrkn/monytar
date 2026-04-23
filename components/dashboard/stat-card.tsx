"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: { value: string; positive: boolean }
  className?: string
  iconClassName?: string
  href?: string
}

export function StatCard({ title, value, icon: Icon, trend, className, iconClassName, href }: StatCardProps) {
  const cardContent = (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/60 hover:border-primary/20 transition-all duration-300 hover:shadow-md hover:shadow-foreground/[0.03]",
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
            <span className="text-2xl font-heading font-extrabold tracking-tight animate-count-up">{value}</span>
          </div>
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl bg-primary/[0.08] transition-colors duration-300 group-hover:bg-primary/[0.12]",
              iconClassName,
            )}
          >
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 mt-3">
            {trend.positive ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            )}
            <span
              className={cn(
                "text-xs font-semibold",
                trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
              )}
            >
              {trend.value}
            </span>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
      {/* Subtle hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      {/* Clickable indicator */}
      {href && (
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="w-4 h-4 text-primary" />
        </div>
      )}
    </Card>
  )
  
  if (href) {
    return <Link href={href} className="block">{cardContent}</Link>
  }
  
  return cardContent
}
