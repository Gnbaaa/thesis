ALTER TABLE ngo_applications
  ADD COLUMN IF NOT EXISTS document_original_name TEXT,
  ADD COLUMN IF NOT EXISTS document_bytes BIGINT;
