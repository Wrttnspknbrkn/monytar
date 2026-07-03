"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import type { User as SupabaseUser, Session } from "@supabase/supabase-js"
import type { User, UserRole } from "@/lib/types"

// Demo mode imports
import { users as mockUsers } from "@/lib/mock-data"

interface AuthContextValue {
  isLoading: boolean
  isAuthenticated: boolean
  isDemo: boolean
  authUser: SupabaseUser | null
  session: Session | null
  dbUser: User | null
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (data: SignUpData) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  // Demo mode helpers
  switchDemoRole: (role: UserRole) => void
  switchDemoUser: (userId: string) => void
}

interface SignUpData {
  email: string
  password: string
  fullName: string
  organizationName?: string
  invitationToken?: string
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const isDemo = !isSupabaseConfigured()
  
  const [isLoading, setIsLoading] = useState(!isDemo)
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [dbUser, setDbUser] = useState<User | null>(null)
  
  // Demo mode state
  const [demoUser, setDemoUser] = useState<User>(mockUsers[3]) // Default employee
  
  // Initialize auth state
  useEffect(() => {
    if (isDemo) {
      setIsLoading(false)
      return
    }
    
    const supabase = getSupabaseBrowserClient()
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthUser(session?.user ?? null)
      
      if (session?.user) {
        fetchDbUser(session.user.id)
      } else {
        setIsLoading(false)
      }
    })
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setAuthUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchDbUser(session.user.id)
        } else {
          setDbUser(null)
        }
        
        if (event === "SIGNED_OUT") {
          router.push("/login")
        }
      }
    )
    
    return () => subscription.unsubscribe()
  }, [isDemo, router])
  
  const fetchDbUser = async (userId: string) => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()
      
      if (error) throw error
      setDbUser(data)
    } catch (error) {
      console.error("Error fetching user:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const signIn = useCallback(async (email: string, password: string) => {
    if (isDemo) {
      // In demo mode, just find the user by email
      const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
      if (user) {
        setDemoUser(user)
        return {}
      }
      return { error: "Invalid credentials" }
    }
    
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        return { error: error.message }
      }
      
      return {}
    } catch (error) {
      return { error: "An unexpected error occurred" }
    }
  }, [isDemo])
  
  const signUp = useCallback(async (data: SignUpData) => {
    if (isDemo) {
      return { error: "Sign up is not available in demo mode" }
    }
    
    try {
      const supabase = getSupabaseBrowserClient()

      // Auth accounts are created server-side (service role) so identity is never
      // trusted from the client. We then establish a session with the credentials.
      if (data.invitationToken) {
        // Join an existing org via invitation. Email is resolved server-side
        // from the invitation record and returned for sign-in.
        const response = await fetch("/api/auth/accept-invitation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: data.invitationToken,
            fullName: data.fullName,
            password: data.password,
          }),
        })

        const result = await response.json().catch(() => ({}))
        if (!response.ok) {
          return { error: result.error || "Failed to accept invitation" }
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: result.email ?? data.email,
          password: data.password,
        })
        if (signInError) return { error: signInError.message }
      } else if (data.organizationName) {
        // Create a new organization + admin account.
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            fullName: data.fullName,
            orgName: data.organizationName,
          }),
        })

        const result = await response.json().catch(() => ({}))
        if (!response.ok) {
          return { error: result.error || "Failed to create organization" }
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        if (signInError) return { error: signInError.message }
      }

      return {}
    } catch (error) {
      return { error: "An unexpected error occurred" }
    }
  }, [isDemo])
  
  const signOut = useCallback(async () => {
    if (isDemo) {
      setDemoUser(mockUsers[3])
      router.push("/login")
      return
    }
    
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
  }, [isDemo, router])
  
  // Demo mode helpers
  const switchDemoRole = useCallback((role: UserRole) => {
    const user = mockUsers.find(u => u.role === role)
    if (user) setDemoUser(user)
  }, [])
  
  const switchDemoUser = useCallback((userId: string) => {
    const user = mockUsers.find(u => u.id === userId)
    if (user) setDemoUser(user)
  }, [])
  
  const value: AuthContextValue = {
    isLoading,
    isAuthenticated: isDemo ? true : !!authUser,
    isDemo,
    authUser,
    session,
    dbUser: isDemo ? demoUser : dbUser,
    signIn,
    signUp,
    signOut,
    switchDemoRole,
    switchDemoUser,
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
