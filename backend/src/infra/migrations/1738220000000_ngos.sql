CREATE TABLE IF NOT EXISTS ngos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL UNIQUE REFERENCES ngo_applications(id) ON DELETE RESTRICT,
  org_name TEXT NOT NULL,
  reg_number TEXT NOT NULL,
  org_address TEXT NOT NULL,
  activity_direction TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  description TEXT,
  document_public_id TEXT NOT NULL,
  document_resource_type TEXT NOT NULL DEFAULT 'raw',
  document_format TEXT,
  document_original_name TEXT,
  document_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ngos_owner_id ON ngos(owner_id);
CREATE INDEX IF NOT EXISTS idx_ngos_application_id ON ngos(application_id);
