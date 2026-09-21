"use client"

import { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText, Store, Users, Building2 } from "lucide-react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useData } from "@/lib/providers"
import { navItemsForRole } from "@/lib/navigation"
import { useAccount } from "./account-info"

interface CommandSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter()
  const { expenseRequests, vendors, users, departments, formatAmount } = useData()
  const { user } = useAccount()
  const role = user?.role

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [onOpenChange, open])

  const navigate = useCallback(
    (path: string) => {
      onOpenChange(false)
      router.push(path)
    },
    [onOpenChange, router],
  )

  // Only offer destinations this role can actually open. Vendor / user /
  // department rows land on that page's list pre-filtered — those pages have
  // no per-item detail route, so linking to one was a 404 dead end.
  const pages = navItemsForRole(role)
  const canSeeUsers = role === "admin"
  const canSeeDepartments = role === "admin" || role === "finance" || role === "manager"

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">Search</DialogTitle>
      <DialogDescription className="sr-only">Jump to a page, request, vendor, user or department</DialogDescription>
      <CommandInput placeholder="Search pages, requests, vendors..." />
      <CommandList>
        <CommandEmpty>No results found. Try a request number, vendor or page name.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((p) => (
            <CommandItem key={p.href} value={`page ${p.label}`} onSelect={() => navigate(p.href)}>
              <p.icon className="mr-2 h-4 w-4" /> {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Recent Requests">
          {expenseRequests.slice(0, 5).map((r) => (
            <CommandItem key={r.id} value={`request ${r.request_number} ${r.purpose}`} onSelect={() => navigate(`/requests/${r.id}`)}>
              <FileText className="mr-2 h-4 w-4" />
              <span>{r.request_number}</span>
              <span className="ml-2 text-muted-foreground truncate">{formatAmount(r.amount)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Vendors">
          {vendors.slice(0, 5).map((v) => (
            <CommandItem key={v.id} value={`vendor ${v.name}`} onSelect={() => navigate(`/vendors?q=${encodeURIComponent(v.name)}`)}>
              <Store className="mr-2 h-4 w-4" />
              <span>{v.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        {canSeeUsers && (
          <CommandGroup heading="Users">
            {users.slice(0, 5).map((u) => (
              <CommandItem key={u.id} value={`user ${u.full_name} ${u.email}`} onSelect={() => navigate(`/users?q=${encodeURIComponent(u.email)}`)}>
                <Users className="mr-2 h-4 w-4" />
                <span>{u.full_name}</span>
                <span className="ml-2 text-muted-foreground truncate">{u.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {canSeeDepartments && (
          <CommandGroup heading="Departments">
            {departments.map((d) => (
              <CommandItem key={d.id} value={`department ${d.name}`} onSelect={() => navigate("/departments")}>
                <Building2 className="mr-2 h-4 w-4" />
                <span>{d.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
