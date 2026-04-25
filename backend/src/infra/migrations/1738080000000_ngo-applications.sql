CREATE TABLE IF NOT EXISTS ngo_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  reg_number TEXT NOT NULL,
  org_address TEXT NOT NULL,
  activity_direction TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  description TEXT,
  document_public_id TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  review_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_ngo_applications_user_id ON ngo_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_ngo_applications_status ON ngo_applications(status);
