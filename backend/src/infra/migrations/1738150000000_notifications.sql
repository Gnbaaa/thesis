CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(48) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_label VARCHAR(64),
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_is_read ON notifications (user_id, is_read);

