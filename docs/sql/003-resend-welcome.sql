-- Run ONCE in Supabase SQL Editor after 001-hotmart.sql has been applied.
-- Private transactional outbox for welcome emails; no secrets are stored here.
BEGIN;
CREATE TABLE IF NOT EXISTS borsamia_private.welcome_deliveries (
  event_id uuid PRIMARY KEY REFERENCES borsamia_private.hotmart_events(event_id),
  transaction_id text NOT NULL,
  product_id text NOT NULL,
  UNIQUE (transaction_id, product_id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sending','sent','cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  locked_at timestamptz,
  sent_at timestamptz,
  provider_id text
);
ALTER TABLE borsamia_private.welcome_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON borsamia_private.welcome_deliveries FROM PUBLIC, anon, authenticated;
COMMIT;
