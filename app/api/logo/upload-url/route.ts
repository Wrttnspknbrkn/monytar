import { NextResponse } from "next/server"
import { logoUploadUrlSchema } from "@/lib/validations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { authorize } from "@/lib/api/authorize"
import { serverError } from "@/lib/api/errors"
import { buildLogoPath, createLogoUploadTarget } from "@/lib/logo/storage"

// POST /api/logo/upload-url
// Returns a short-lived signed URL the client uses to upload the org's logo
// directly to storage (admin-only). Mirrors /api/receipts/upload-url.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = logoUploadUrlSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        demo: true,
        path: `demo/logo-${parsed.data.file_name}`,
        token: "demo-token",
        signedUrl: "https://example.com/demo-upload",
      })
    }

    const { actor, response } = await authorize(["admin"])
    if (response) return response
    const { organizationId } = actor

    const path = buildLogoPath(organizationId, parsed.data.file_name)
    const target = await createLogoUploadTarget(path)

    if (!target) {
      return NextResponse.json({ error: "Could not create upload URL" }, { status: 500 })
    }

    return NextResponse.json(target)
  } catch (err) {
    return serverError(err, { route: "logo.upload-url.POST" })
  }
}
