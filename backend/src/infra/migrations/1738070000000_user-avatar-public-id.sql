ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_public_id TEXT;

CREATE INDEX IF NOT EXISTS idx_users_avatar_public_id ON users (avatar_public_id) WHERE avatar_public_id IS NOT NULL;

