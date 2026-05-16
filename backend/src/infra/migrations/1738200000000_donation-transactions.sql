CREATE TABLE IF NOT EXISTS donation_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES donation_posts(id) ON DELETE CASCADE,
  donor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  donor_display_name TEXT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'succeeded',
  stripe_payment_intent_id TEXT,
  stripe_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donation_tx_post_created
  ON donation_transactions(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donation_tx_donor_id
  ON donation_transactions(donor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_donation_tx_stripe_event_id
  ON donation_transactions(stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;
