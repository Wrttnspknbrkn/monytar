import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"

export type UserRole = "employee" | "manager" | "finance" | "admin"

export interface AuthorizedActor {
  supabase: SupabaseClient
  userId: string
  organizationId: string
  departmentId: string | null
  role: UserRole
}

/**
 * Resolves the authenticated user and their organization-scoped profile
 * (role, organization, department) for use in Route Handlers.
 *
 * Returns either an `actor` (on success) or a ready-to-return `response`
 * (401 if unauthenticated, 404 if the profile is missing).
 */
export async function authorize(
  allowedRoles?: UserRole[],
): Promise<{ actor: AuthorizedActor; response?: never } | { actor?: never; response: NextResponse }> {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("organization_id, department_id, role, is_active")
    .eq("id", user.id)
    .single()

  if (!dbUser) {
    return { response: NextResponse.json({ error: "User profile not found" }, { status: 404 }) }
  }

  if (dbUser.is_active === false) {
    return { response: NextResponse.json({ error: "Account is deactivated" }, { status: 403 }) }
  }

  if (allowedRoles && !allowedRoles.includes(dbUser.role as UserRole)) {
    return {
      response: NextResponse.json(
        { error: "You do not have permission to perform this action" },
        { status: 403 },
      ),
    }
  }

  return {
    actor: {
      supabase,
      userId: user.id,
      organizationId: dbUser.organization_id,
      departmentId: dbUser.department_id,
      role: dbUser.role as UserRole,
    },
  }
}
