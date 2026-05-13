CREATE TABLE IF NOT EXISTS volunteer_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  event_date DATE NOT NULL,
  required_count INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  photo_public_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volunteer_posts_status ON volunteer_posts(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_posts_location ON volunteer_posts(location);
CREATE INDEX IF NOT EXISTS idx_volunteer_posts_created_at ON volunteer_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_volunteer_posts_event_date ON volunteer_posts(event_date);
CREATE INDEX IF NOT EXISTS idx_volunteer_posts_owner_id ON volunteer_posts(owner_id);
