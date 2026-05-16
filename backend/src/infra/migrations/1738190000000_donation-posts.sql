CREATE TABLE IF NOT EXISTS donation_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  goal_amount BIGINT NOT NULL CHECK (goal_amount > 0),
  collected_amount BIGINT NOT NULL DEFAULT 0 CHECK (collected_amount >= 0),
  status TEXT NOT NULL DEFAULT 'active',
  photo_public_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donation_posts_status ON donation_posts(status);
CREATE INDEX IF NOT EXISTS idx_donation_posts_created_at ON donation_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donation_posts_owner_id ON donation_posts(owner_id);
