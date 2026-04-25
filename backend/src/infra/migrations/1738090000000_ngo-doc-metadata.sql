ALTER TABLE ngo_applications
  ADD COLUMN IF NOT EXISTS document_resource_type TEXT NOT NULL DEFAULT 'raw',
  ADD COLUMN IF NOT EXISTS document_format TEXT;

CREATE INDEX IF NOT EXISTS idx_ngo_applications_submitted_at ON ngo_applications(submitted_at DESC);
