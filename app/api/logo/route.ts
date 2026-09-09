import { NextResponse } from "next/server"
import { logoRecordSchema } from "@/lib/validations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { authorize } from "@/lib/api/authorize"
import { serverError } from "@/lib/api/errors"
import { getLogoPublicUrl, deleteLogoObject } from "@/lib/logo/storage"

// POST /api/logo
// Finalizes a logo upload: the file is already in storage (via the signed
// URL from /api/logo/upload-url) — this records its public URL on the org.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = logoRecordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, logo_url: null })
    }

    const { actor, response } = await authorize(["admin"])
    if (response) return response
    const { supabase, organizationId } = actor

    const logoUrl = await getLogoPublicUrl(parsed.data.file_path)

    const { error } = await supabase
      .from("organizations")
      .update({ logo_url: logoUrl })
      .eq("id", organizationId)

    if (error) return serverError(error, { route: "logo.POST" })
    return NextResponse.json({ logo_url: logoUrl })
  } catch (err) {
    return serverError(err, { route: "logo.POST" })
  }
}

// DELETE /api/logo — removes the org's logo (storage object + column).
export async function DELETE() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, success: true })
    }

    const { actor, response } = await authorize(["admin"])
    if (response) return response
    const { supabase, organizationId } = actor

    const { data: org } = await supabase
      .from("organizations")
      .select("logo_url")
      .eq("id", organizationId)
      .single()

    const { error } = await supabase
      .from("organizations")
      .update({ logo_url: null })
      .eq("id", organizationId)

    if (error) return serverError(error, { route: "logo.DELETE" })

    // Best-effort object cleanup — the column update above is what matters;
    // don't fail the request over a storage-removal hiccup.
    if (org?.logo_url) {
      try {
        const path = new URL(org.logo_url).pathname.split(`/logos/`)[1]
        if (path) await deleteLogoObject(decodeURIComponent(path))
      } catch {
        // Non-fatal.
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return serverError(err, { route: "logo.DELETE" })
  }
}
