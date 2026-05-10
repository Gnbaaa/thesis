ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS source_id TEXT;

-- Dedupe notifications by (user, source_id) when source_id is present.
CREATE UNIQUE INDEX IF NOT EXISTS ux_notifications_user_source
  ON notifications (user_id, source_id)
  WHERE source_id IS NOT NULL;

