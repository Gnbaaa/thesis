CREATE TABLE IF NOT EXISTS adoption_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  living_environment TEXT NOT NULL,
  has_owned_pet_before BOOLEAN NOT NULL,
  household_size INT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adoption_requests_pet_id ON adoption_requests(pet_id);
CREATE INDEX IF NOT EXISTS idx_adoption_requests_requester_id ON adoption_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_adoption_requests_status ON adoption_requests(status);

