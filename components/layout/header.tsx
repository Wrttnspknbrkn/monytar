"use client"

import { Bell, Search, ChevronDown, LogOut, User, Settings, Shield } from "lucide-react"
import { useStore } from "@/lib/store"
import { cn, getInitials, getRoleLabel, formatRelativeTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import type { UserRole } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CommandSearch } from "./command-search"

const roleColors: Record<UserRole, string> = {
  employee: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  manager: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  finance: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  admin: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
}

const roleAvatarColors: Record<UserRole, string> = {
  employee: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  manager: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  finance: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  admin: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
}

export function Header() {
  const router = useRouter()
  const {
    currentUser,
    notifications,
    switchRole,
    getUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useStore()
  const unreadCount = getUnreadNotificationCount()
  const userNotifs = notifications.filter((n) => n.user_id === currentUser.id).slice(0, 10)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center h-14 px-4 gap-4 bg-card/80 glass border-b border-border/60">
        {/* Search */}
        <Button
          variant="outline"
          className="hidden md:flex items-center gap-2 text-muted-foreground w-60 justify-start bg-transparent border-border/60 hover:border-border hover:bg-secondary/50 h-9"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-[13px]">Search...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border bg-secondary/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-[10px]">Ctrl</span>K
          </kbd>
        </Button>
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setSearchOpen(true)}>
          <Search className="w-4 h-4" />
        </Button>

        <div className="flex-1" />

        {/* Role Badge */}
        <span
          className={cn(
            "hidden sm:inline-flex items-center px-2.5 py-1 rounded-md border text-[11px] font-semibold uppercase tracking-wider",
            roleColors[currentUser.role],
          )}
        >
          {getRoleLabel(currentUser.role)}
        </span>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-secondary/80">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-sm shadow-primary/25">
                  {unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 rounded-xl shadow-xl shadow-foreground/5" align="end">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h4 className="font-heading font-semibold text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto py-1 text-primary hover:text-primary"
                  onClick={markAllNotificationsRead}
                >
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="h-80">
              {userNotifs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  No notifications yet
                </div>
              ) : (
                <div className="flex flex-col">
                  {userNotifs.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      className={cn(
                        "flex flex-col gap-1 p-4 text-left border-b border-border/50 hover:bg-secondary/50 transition-colors",
                        !notif.is_read && "bg-primary/[0.03]",
                      )}
                      onClick={() => {
                        markNotificationRead(notif.id)
                        if (notif.related_entity_type === "expense_request" && notif.related_entity_id) {
                          router.push(`/requests/${notif.related_entity_id}`)
                        }
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-sm shadow-primary/30" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{notif.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1.5">{formatRelativeTime(notif.created_at)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2.5 px-2 h-9 hover:bg-secondary/80">
              <Avatar className="w-7 h-7">
                <AvatarFallback
                  className={cn("text-[11px] font-bold", roleAvatarColors[currentUser.role])}
                >
                  {getInitials(currentUser.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-[13px] font-medium">{currentUser.full_name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl shadow-foreground/5">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="font-heading font-semibold">{currentUser.full_name}</span>
                <span className="text-xs text-muted-foreground font-normal">{currentUser.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User className="w-4 h-4 mr-2" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Shield className="w-4 h-4 mr-2" /> Switch Role (Demo)
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {(["employee", "manager", "finance", "admin"] as UserRole[]).map((role) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => switchRole(role)}
                    className={cn(currentUser.role === role && "bg-accent")}
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full mr-2",
                        role === "employee" && "bg-blue-500",
                        role === "manager" && "bg-emerald-500",
                        role === "finance" && "bg-amber-500",
                        role === "admin" && "bg-rose-500",
                      )}
                    />
                    {getRoleLabel(role)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/")}>
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
