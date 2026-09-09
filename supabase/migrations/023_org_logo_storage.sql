-- Monytar — organization logo upload.
--
-- Audit finding (P1-8): organizations.logo_url has existed in the schema
-- since 003_subscription_columns.sql but nothing anywhere — no upload UI, no
-- API route, zero references beyond the column/type — ever wrote to it.
-- Clones the receipts storage pattern (008_receipts_storage_vendor_totals.sql):
-- a signed-upload-URL route + org-scoped path prefix, except this bucket is
-- PUBLIC-read (a logo is meant to be displayed, not gated behind a signed
-- URL) while writes stay restricted to admins of that org.
--
-- Safe to run repeatedly.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public bucket: anyone can read (this is what makes the logo visible in the
-- product without a signed URL). Writes require the first path segment to
-- equal the caller's own organization_id AND that they're an admin there.
DROP POLICY IF EXISTS "logos_storage_select" ON storage.objects;
CREATE POLICY "logos_storage_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "logos_storage_insert" ON storage.objects;
CREATE POLICY "logos_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "logos_storage_delete" ON storage.objects;
CREATE POLICY "logos_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
