"use client"

import { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText, Store, Users, Building2, LayoutDashboard, BarChart3, Settings } from "lucide-react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useData } from "@/lib/providers"

interface CommandSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter()
  const { expenseRequests, vendors, users, departments, formatAmount } = useData()

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

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search requests, vendors, users..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => navigate("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => navigate("/requests")}>
            <FileText className="mr-2 h-4 w-4" /> Requests
          </CommandItem>
          <CommandItem onSelect={() => navigate("/vendors")}>
            <Store className="mr-2 h-4 w-4" /> Vendors
          </CommandItem>
          <CommandItem onSelect={() => navigate("/reports")}>
            <BarChart3 className="mr-2 h-4 w-4" /> Reports
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Recent Requests">
          {expenseRequests.slice(0, 5).map((r) => (
            <CommandItem key={r.id} onSelect={() => navigate(`/requests/${r.id}`)}>
              <FileText className="mr-2 h-4 w-4" />
              <span>{r.request_number}</span>
              <span className="ml-2 text-muted-foreground">{formatAmount(r.amount)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Vendors">
          {vendors.slice(0, 5).map((v) => (
            <CommandItem key={v.id} onSelect={() => navigate(`/vendors/${v.id}`)}>
              <Store className="mr-2 h-4 w-4" />
              <span>{v.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Users">
          {users.slice(0, 5).map((u) => (
            <CommandItem key={u.id} onSelect={() => navigate(`/users/${u.id}`)}>
              <Users className="mr-2 h-4 w-4" />
              <span>{u.full_name}</span>
              <span className="ml-2 text-muted-foreground">{u.email}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Departments">
          {departments.map((d) => (
            <CommandItem key={d.id} onSelect={() => navigate(`/departments/${d.id}`)}>
              <Building2 className="mr-2 h-4 w-4" />
              <span>{d.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
