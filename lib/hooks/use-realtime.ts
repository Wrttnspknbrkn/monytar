"use client"

import { useEffect } from "react"
import { mutate } from "swr"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/config"

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE"

interface RealtimeConfig {
  table: string
  schema?: string
  event?: RealtimeEvent | "*"
  filter?: string
}

/**
 * Hook to subscribe to real-time database changes
 * Automatically revalidates SWR cache when changes occur
 */
export function useRealtimeSubscription(
  config: RealtimeConfig,
  cacheKeyPrefix: string,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) return

    const supabase = getSupabaseBrowserClient()
    const channelName = `realtime:${config.table}:${config.filter || "all"}`

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as any,
        {
          event: config.event || "*",
          schema: config.schema || "public",
          table: config.table,
          filter: config.filter,
        },
        (payload: any) => {
          // Revalidate all SWR caches that match the prefix
          mutate(
            (key: string) => typeof key === "string" && key.startsWith(cacheKeyPrefix),
            undefined,
            { revalidate: true }
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [config.table, config.filter, config.event, config.schema, cacheKeyPrefix, enabled])
}

/**
 * Hook to subscribe to expense request changes for an organization
 */
export function useExpenseRequestsRealtime(orgId: string | undefined) {
  useRealtimeSubscription(
    {
      table: "expense_requests",
      filter: orgId ? `organization_id=eq.${orgId}` : undefined,
    },
    "expense-request",
    !!orgId
  )
}

/**
 * Hook to subscribe to notification changes for a user
 */
export function useNotificationsRealtime(userId: string | undefined) {
  useRealtimeSubscription(
    {
      table: "notifications",
      filter: userId ? `user_id=eq.${userId}` : undefined,
    },
    "notifications:",
    !!userId
  )
}

/**
 * Hook to subscribe to organization changes (for billing updates)
 */
export function useOrganizationRealtime(orgId: string | undefined) {
  useRealtimeSubscription(
    {
      table: "organizations",
      filter: orgId ? `id=eq.${orgId}` : undefined,
    },
    "organization",
    !!orgId
  )
}

/**
 * Hook to subscribe to user changes in organization
 */
export function useUsersRealtime(orgId: string | undefined) {
  useRealtimeSubscription(
    {
      table: "users",
      filter: orgId ? `organization_id=eq.${orgId}` : undefined,
    },
    "users:",
    !!orgId
  )
}
