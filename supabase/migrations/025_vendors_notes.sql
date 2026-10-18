-- Monytar — vendors.notes
--
-- The "Add a vendor" form has always had a Notes box and has always sent it, but the vendors table never had
-- a `notes` column. With Notes left blank the field is dropped from the request, so adding a vendor worked;
-- as soon as anyone typed a note the database refused the whole insert (PostgREST error PGRST204, "Could not
-- find the 'notes' column of 'vendors'"), and the page only said "Couldn't add the vendor".
--
-- This adds the column. Safe to run more than once.

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS notes TEXT;

-- Make the API pick up the new column straight away instead of waiting for its schema cache to refresh.
NOTIFY pgrst, 'reload schema';
