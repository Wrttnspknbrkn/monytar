"use client"

import useSWR from "swr"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { DEFAULT_EXPENSE_CATEGORIES, type ExpenseCategoryOption } from "@/lib/types"

const DEMO_CATEGORIES: ExpenseCategoryOption[] = DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
  id: name,
  organization_id: null,
  name,
  is_active: true,
}))

async function fetchCategories(): Promise<ExpenseCategoryOption[]> {
  const res = await fetch("/api/categories")
  if (!res.ok) throw new Error("Failed to load categories")
  const json = await res.json()
  return json.data || []
}

/** System defaults + this org's own custom categories. Falls back to the 6
 * hardcoded defaults in demo mode, where there's no API/DB to query. */
export function useExpenseCategories() {
  const swr = useSWR<ExpenseCategoryOption[]>(
    isSupabaseConfigured() ? "expense-categories" : null,
    fetchCategories,
  )
  return {
    categories: isSupabaseConfigured() ? swr.data || [] : DEMO_CATEGORIES,
    isLoading: isSupabaseConfigured() ? swr.isLoading : false,
    mutate: swr.mutate,
  }
}
