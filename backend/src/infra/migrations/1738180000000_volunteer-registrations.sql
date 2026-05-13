CREATE TABLE IF NOT EXISTS volunteer_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES volunteer_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_volunteer_registrations_post_id ON volunteer_registrations(post_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_registrations_user_id ON volunteer_registrations(user_id);
