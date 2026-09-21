"use client"

import { LogOut } from "lucide-react"
import { useAuth, useData } from "@/lib/providers"
import { cn, getInitials, getRoleLabel } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { User, UserRole } from "@/lib/types"

export const roleBadgeColors: Record<UserRole, string> = {
  employee: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  manager: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  finance: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  admin: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
}

export const roleAvatarColors: Record<UserRole, string> = {
  employee: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  manager: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  finance: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  admin: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
}

/** One place that answers "who is signed in, as what, in which department". */
export function useAccount(): {
  user: User | null
  roleLabel: string
  departmentName: string | undefined
  signOut: () => Promise<void>
} {
  const { dbUser, signOut } = useAuth()
  const { currentUser, departments } = useData()
  const user = dbUser || currentUser || null
  const departmentName = user?.department_id ? departments.find((d) => d.id === user.department_id)?.name : undefined
  return { user, roleLabel: user ? getRoleLabel(user.role) : "", departmentName, signOut }
}

/**
 * "Signed in as Jane Doe — Finance · Operations", with email underneath.
 * Used in the sidebar, the mobile menu and the header account menu so the
 * identity/role wording is identical everywhere.
 */
export function SignedInAs({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { user, roleLabel, departmentName } = useAccount()
  if (!user) return null
  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <Avatar className={compact ? "w-8 h-8" : "w-10 h-10"}>
        <AvatarFallback className={cn("text-xs font-bold", roleAvatarColors[user.role])}>{getInitials(user.full_name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground leading-none mb-1">Signed in as</p>
        <p className="text-sm font-semibold truncate leading-tight">{user.full_name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {roleLabel}
          {departmentName ? ` · ${departmentName}` : ""}
        </p>
        {!compact && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
      </div>
    </div>
  )
}

export function LogoutButton({ className, variant = "outline" }: { className?: string; variant?: "outline" | "ghost" }) {
  const { signOut } = useAccount()
  return (
    <Button variant={variant} className={cn("justify-start gap-2 font-semibold", className)} onClick={() => void signOut()}>
      <LogOut className="w-4 h-4" /> Log out
    </Button>
  )
}
