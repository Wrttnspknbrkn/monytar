"use client"

import { Bell, Search, ChevronDown, LogOut, Settings, Shield, ArrowRight } from "lucide-react"
import { useData, useAuth } from "@/lib/providers"
import { cn, getInitials, formatRelativeTime } from "@/lib/utils"
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
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { CommandSearch } from "./command-search"
import { pageTitleFor } from "@/lib/navigation"
import { SignedInAs, roleAvatarColors, roleBadgeColors, useAccount } from "./account-info"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { switchDemoRole, isDemo } = useAuth()
  const { notifications, getUnreadNotificationCount, markNotificationRead } = useData()
  const { user, roleLabel, departmentName, signOut } = useAccount()

  const unreadCount = getUnreadNotificationCount()
  const userNotifs = user ? notifications.filter((n) => n.user_id === user.id).slice(0, 10) : []
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const markAllRead = async () => {
    for (const notif of userNotifs.filter((n) => !n.is_read)) {
      await markNotificationRead(notif.id)
    }
  }

  // Even if the profile hasn't resolved, the header must still offer a way
  // out — otherwise a half-loaded session is a dead end with no Log out.
  if (!user) {
    return (
      <header className="sticky top-0 z-30 flex items-center h-14 px-3 sm:px-4 gap-3 bg-card/80 glass border-b border-border/60">
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="font-semibold gap-2" onClick={() => void signOut()}>
          <LogOut className="w-4 h-4" /> Log out
        </Button>
      </header>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center h-14 px-3 sm:px-4 gap-2 sm:gap-4 bg-card/80 glass border-b border-border/60">
        {/* Current page — mobile has no sidebar, so this is the "where am I" cue */}
        <h2 className="md:hidden font-heading font-bold text-base truncate min-w-0 flex-1">{pageTitleFor(pathname)}</h2>

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
        <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 shrink-0" onClick={() => setSearchOpen(true)} aria-label="Search">
          <Search className="w-4 h-4" />
        </Button>

        <div className="hidden md:block flex-1" />

        {/* Role badge — always visible so it's clear which role you're using */}
        <span
          title={`You are signed in as ${roleLabel}`}
          className={cn(
            "inline-flex shrink-0 items-center px-2 sm:px-2.5 py-1 rounded-md border text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider",
            roleBadgeColors[user.role],
          )}
        >
          {roleLabel}
        </span>

        {/* Notifications */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-10 w-10 sm:h-9 sm:w-9 shrink-0 hover:bg-secondary/80">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-sm shadow-primary/25">
                  {unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications{unreadCount > 0 ? ` (${unreadCount} unread)` : ""}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(20rem,calc(100vw-1.5rem))] p-0 rounded-xl shadow-xl shadow-foreground/5" align="end" collisionPadding={12}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h4 className="font-heading font-semibold text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-auto py-1 text-primary hover:text-primary" onClick={markAllRead}>
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="h-72 max-h-[50dvh]">
              {userNotifs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  You&apos;re all caught up — no notifications yet.
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
                        setNotifOpen(false)
                        if (notif.related_entity_type === "expense_request" && notif.related_entity_id) {
                          router.push(`/requests/${notif.related_entity_id}`)
                        }
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        {!notif.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-sm shadow-primary/30" />}
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
            <Link
              href="/notifications"
              onClick={() => setNotifOpen(false)}
              className="flex items-center justify-center gap-1.5 p-3 border-t border-border text-xs font-semibold text-primary hover:bg-secondary/50 rounded-b-xl"
            >
              View all notifications <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </PopoverContent>
        </Popover>

        {/* Account menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2.5 px-1.5 sm:px-2 h-10 sm:h-9 shrink-0 hover:bg-secondary/80" aria-label={`Account menu for ${user.full_name}, ${roleLabel}`}>
              <Avatar className="w-7 h-7">
                <AvatarFallback className={cn("text-[11px] font-bold", roleAvatarColors[user.role])}>{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>
              <span className="hidden lg:flex flex-col items-start leading-tight text-left max-w-40">
                <span className="text-[13px] font-medium truncate max-w-full">{user.full_name}</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-full">
                  {roleLabel}
                  {departmentName ? ` · ${departmentName}` : ""}
                </span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" collisionPadding={12} className="w-[min(18rem,calc(100vw-1.5rem))] rounded-xl shadow-xl shadow-foreground/5">
            <DropdownMenuLabel className="font-normal">
              <SignedInAs />
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="min-h-10">
              <Link href="/settings">
                <Settings className="w-4 h-4 mr-2" /> Account &amp; settings
              </Link>
            </DropdownMenuItem>
            {isDemo && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="min-h-10">
                    <Shield className="w-4 h-4 mr-2" /> Switch Role (Demo)
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {(["employee", "manager", "finance", "admin"] as UserRole[]).map((role) => (
                      <DropdownMenuItem key={role} onClick={() => switchDemoRole(role)} className={cn("min-h-10 capitalize", user.role === role && "bg-accent")}>
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full mr-2",
                            role === "employee" && "bg-blue-500",
                            role === "manager" && "bg-emerald-500",
                            role === "finance" && "bg-amber-500",
                            role === "admin" && "bg-rose-500",
                          )}
                        />
                        {role}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void signOut()} className="min-h-10 text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
