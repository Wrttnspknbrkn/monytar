"use client"

import type { ReactNode } from "react"
import { AuthProvider } from "./auth-provider"
import { DataProvider } from "./data-provider"

interface ProvidersProps {
  children: ReactNode
}

/**
 * Combined providers wrapper for the application.
 * Includes authentication and data management.
 * 
 * The order matters:
 * 1. AuthProvider - handles authentication state
 * 2. DataProvider - depends on auth for user context
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <DataProvider>
        {children}
      </DataProvider>
    </AuthProvider>
  )
}

// Re-export hooks for convenience
export { useAuth } from "./auth-provider"
export { useData } from "./data-provider"
