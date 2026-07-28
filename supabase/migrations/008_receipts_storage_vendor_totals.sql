-- Migration 008: Receipt storage, vendor-total automation, race-safe request numbers
-- Safe to run multiple times (idempotent guards throughout).

-- ============================================================================
-- 1. Reconcile the receipts table with the application Receipt type
-- ============================================================================
ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill created_at from the legacy uploaded_at column where missing.
UPDATE receipts SET created_at = uploaded_at WHERE created_at IS NULL AND uploaded_at IS NOT NULL;

-- Backfill organization_id from the parent expense request.
UPDATE receipts r
SET organization_id = er.organization_id
FROM expense_requests er
WHERE r.expense_request_id = er.id AND r.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_receipts_org ON receipts(organization_id);
CREATE INDEX IF NOT EXISTS idx_receipts_request ON receipts(expense_request_id);

-- ============================================================================
-- 2. Row Level Security for receipts (tenant-scoped)
-- ============================================================================
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "receipts_select_same_org" ON receipts;
CREATE POLICY "receipts_select_same_org" ON receipts
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "receipts_insert_same_org" ON receipts;
CREATE POLICY "receipts_insert_same_org" ON receipts
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "receipts_delete_owner_or_admin" ON receipts;
CREATE POLICY "receipts_delete_owner_or_admin" ON receipts
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (
      uploaded_by = auth.uid()
      OR (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'finance')
    )
  );

-- ============================================================================
-- 3. Private storage bucket for receipt files + storage RLS
--    Files are keyed by  <organization_id>/<expense_request_id>/<filename>
--    so tenant isolation is enforced on the storage path prefix.
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- The first path segment must equal the caller's organization_id.
DROP POLICY IF EXISTS "receipts_storage_select" ON storage.objects;
CREATE POLICY "receipts_storage_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "receipts_storage_insert" ON storage.objects;
CREATE POLICY "receipts_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "receipts_storage_delete" ON storage.objects;
CREATE POLICY "receipts_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM users WHERE id = auth.uid())
  );

-- ============================================================================
-- 4. Vendor spend/transaction totals kept in sync automatically
--    A request counts toward a vendor's totals once it becomes 'paid'.
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_vendor_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Newly paid: add to the vendor total.
  IF (TG_OP = 'UPDATE' AND NEW.vendor_id IS NOT NULL
      AND NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid') THEN
    UPDATE vendors
      SET total_spend = COALESCE(total_spend, 0) + NEW.amount,
          transaction_count = COALESCE(transaction_count, 0) + 1,
          updated_at = NOW()
      WHERE id = NEW.vendor_id;
  END IF;

  -- Reversed away from paid: subtract from the vendor total.
  IF (TG_OP = 'UPDATE' AND OLD.vendor_id IS NOT NULL
      AND OLD.status = 'paid' AND NEW.status IS DISTINCT FROM 'paid') THEN
    UPDATE vendors
      SET total_spend = GREATEST(COALESCE(total_spend, 0) - OLD.amount, 0),
          transaction_count = GREATEST(COALESCE(transaction_count, 0) - 1, 0),
          updated_at = NOW()
      WHERE id = OLD.vendor_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_vendor_totals ON expense_requests;
CREATE TRIGGER trg_sync_vendor_totals
  AFTER UPDATE ON expense_requests
  FOR EACH ROW EXECUTE FUNCTION sync_vendor_totals();

-- ============================================================================
-- 5. Race-safe, per-organization request numbers  (REQ-YYYY-00001)
--    Uses a dedicated counter table with an atomic UPSERT so concurrent
--    inserts can never collide on request_number.
-- ============================================================================
CREATE TABLE IF NOT EXISTS request_number_counters (
  organization_id UUID NOT NULL,
  year INTEGER NOT NULL,
  last_value INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (organization_id, year)
);

CREATE OR REPLACE FUNCTION next_request_number(org UUID)
RETURNS TEXT AS $$
DECLARE
  yr INTEGER := EXTRACT(YEAR FROM NOW());
  seq INTEGER;
BEGIN
  INSERT INTO request_number_counters (organization_id, year, last_value)
    VALUES (org, yr, 1)
  ON CONFLICT (organization_id, year)
    DO UPDATE SET last_value = request_number_counters.last_value + 1
  RETURNING last_value INTO seq;

  RETURN 'REQ-' || yr || '-' || LPAD(seq::text, 5, '0');
END;
$$ LANGUAGE plpgsql;
