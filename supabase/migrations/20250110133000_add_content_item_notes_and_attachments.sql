-- Ensure collaborative metadata fields exist on content items
ALTER TABLE content_items
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE content_items
  ADD COLUMN IF NOT EXISTS attachments JSONB;

-- Refresh PostgREST so the new columns are available immediately
NOTIFY pgrst, 'reload schema';
