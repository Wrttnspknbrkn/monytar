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
  employee: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  manager: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  finance: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  admin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
}

export function Header() {
  const router = useRouter()
  const { currentUser, notifications, switchRole, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } =
    useStore()
  const unreadCount = getUnreadNotificationCount()
  const userNotifs = notifications.filter((n) => n.user_id === currentUser.id).slice(0, 10)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center h-16 px-4 gap-4 bg-card border-b border-border">
        {/* Search */}
        <Button
          variant="outline"
          className="hidden md:flex items-center gap-2 text-muted-foreground w-64 justify-start bg-transparent"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Search...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">Ctrl</span>K
          </kbd>
        </Button>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(true)}>
          <Search className="w-5 h-5" />
        </Button>

        <div className="flex-1" />

        {/* Role Badge */}
        <span className={cn("hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", roleColors[currentUser.role])}>
          {getRoleLabel(currentUser.role)}
        </span>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium">
                  {unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h4 className="font-semibold text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-auto py-1" onClick={markAllNotificationsRead}>
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="h-80">
              {userNotifs.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
              ) : (
                <div className="flex flex-col">
                  {userNotifs.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      className={cn(
                        "flex flex-col gap-1 p-4 text-left border-b border-border hover:bg-muted/50 transition-colors",
                        !notif.is_read && "bg-primary/5",
                      )}
                      onClick={() => {
                        markNotificationRead(notif.id)
                        if (notif.related_entity_type === "expense_request" && notif.related_entity_id) {
                          router.push(`/requests/${notif.related_entity_id}`)
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {!notif.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{notif.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notif.created_at)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="p-2 border-t border-border">
              <Link href="/notifications">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  View all notifications
                </Button>
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {getInitials(currentUser.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium">{currentUser.full_name}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span>{currentUser.full_name}</span>
                <span className="text-xs text-muted-foreground font-normal">{currentUser.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings"><User className="w-4 h-4 mr-2" /> Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings"><Settings className="w-4 h-4 mr-2" /> Settings</Link>
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
                    <span className={cn("w-2 h-2 rounded-full mr-2", roleColors[role].split(" ")[0])} />
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
