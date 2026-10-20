-- Review and apply explicitly to the authorized Supabase database, never during build.
BEGIN;
CREATE SCHEMA IF NOT EXISTS borsamia_private;
REVOKE ALL ON SCHEMA borsamia_private FROM PUBLIC, anon, authenticated;

CREATE TABLE borsamia_private.product_mappings (
  product_id text PRIMARY KEY,
  collection_id text UNIQUE NOT NULL,
  access_kind text NOT NULL CHECK (access_kind IN ('purchase', 'subscription')),
  plan_id text,
  enabled boolean NOT NULL DEFAULT true,
  CHECK (length(product_id) > 0)
);
INSERT INTO borsamia_private.product_mappings (product_id, collection_id, access_kind, plan_id)
VALUES ('8765000', 'borse', 'purchase', NULL),
       ('8765113', 'fodere', 'purchase', NULL),
       ('8766213', 'portachiavi-37', 'purchase', NULL),
       ('8765856', 'club', 'subscription', NULL);

CREATE TABLE borsamia_private.hotmart_events (
  event_id uuid PRIMARY KEY,
  fingerprint text NOT NULL,
  event_type text NOT NULL,
  occurred_at bigint NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  product_id text NOT NULL,
  buyer_email text NOT NULL,
  transaction_id text,
  purchase_state text NOT NULL,
  plan_id text,
  subscriber_code text,
  subscription_id text,
  approved_at bigint,
  cancellation_at bigint,
  next_charge text,
  subscription_status text,
  parent_transaction text,
  disposition text NOT NULL CHECK (disposition IN
    ('sandbox', 'unmapped', 'plan_mismatch', 'needs_reconciliation', 'recorded'))
);
CREATE INDEX hotmart_transaction_idx ON borsamia_private.hotmart_events (transaction_id);
CREATE INDEX hotmart_buyer_idx ON borsamia_private.hotmart_events (buyer_email);
CREATE TABLE borsamia_private.collection_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id text NOT NULL,
  title_it text NOT NULL,
  description_it text,
  file_type text NOT NULL CHECK (file_type IN ('pdf','video')),
  storage_path text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (collection_id) REFERENCES borsamia_private.product_mappings(collection_id)
);
CREATE INDEX collection_files_public_idx ON borsamia_private.collection_files (collection_id, visible, display_order);
CREATE TABLE borsamia_private.rate_limits (
  key text PRIMARY KEY,
  started_at timestamptz NOT NULL,
  hits integer NOT NULL CHECK (hits > 0)
);

-- Evento validado na entrada; cada transação é auditável.
-- Assinaturas: somente compras pagas, assinatura ACTIVE e data de próximo
-- pagamento comprovada no evento de compra; alterações de data NÃO renovam acesso.
CREATE OR REPLACE VIEW borsamia_private.current_entitlements AS
WITH transactions AS (
  SELECT transaction_id, min(product_id) product_id, min(buyer_email) buyer_email,
    count(DISTINCT product_id)=1 AND count(DISTINCT buyer_email)=1 AS consistent,
    bool_or(purchase_state IN ('APPROVED','COMPLETE')) AS approved,
    bool_or(purchase_state IN ('REFUNDED','CHARGEBACK','CANCELED')) AS revoked,
    bool_and(disposition = 'recorded') AS usable
  FROM borsamia_private.hotmart_events
  WHERE transaction_id IS NOT NULL
  GROUP BY transaction_id
),
perpetual AS (
  SELECT DISTINCT t.buyer_email, m.collection_id
  FROM transactions t JOIN borsamia_private.product_mappings m ON m.product_id=t.product_id
  WHERE t.consistent AND t.approved AND NOT t.revoked AND t.usable
    AND m.enabled AND m.access_kind='purchase'
),
club_paid AS (
  SELECT DISTINCT e.buyer_email, m.collection_id, e.product_id, e.subscriber_code,
    e.occurred_at, CASE WHEN e.next_charge ~ '^[0-9]{13}$' THEN e.next_charge::bigint ELSE 0 END AS paid_until_ms
  FROM borsamia_private.hotmart_events e
  JOIN borsamia_private.product_mappings m ON m.product_id=e.product_id
  JOIN transactions t ON t.transaction_id=e.transaction_id
  WHERE m.enabled AND m.access_kind='subscription'
    AND t.consistent AND t.approved AND NOT t.revoked
    AND e.disposition='recorded' AND e.purchase_state IN ('APPROVED','COMPLETE')
    AND e.subscription_status='ACTIVE' AND e.subscriber_code IS NOT NULL
    AND e.next_charge ~ '^[0-9]{13}$' AND (CASE WHEN e.next_charge ~ '^[0-9]{13}$' THEN e.next_charge::bigint ELSE 0 END) > extract(epoch from now())*1000
    AND (CASE WHEN e.next_charge ~ '^[0-9]{13}$' THEN e.next_charge::bigint ELSE 0 END) < (extract(epoch from now())+65*86400)*1000
    -- Delayed/inactive notices after the last paid renewal block access.
    AND NOT EXISTS (
      SELECT 1 FROM borsamia_private.hotmart_events blocked
      WHERE blocked.product_id=e.product_id AND blocked.subscriber_code=e.subscriber_code
      AND blocked.buyer_email=e.buyer_email AND blocked.occurred_at > e.occurred_at
      AND blocked.purchase_state IN ('DELAYED','OVERDUE','INACTIVE','REFUNDED','CHARGEBACK')
    )
)
SELECT buyer_email, collection_id FROM perpetual
UNION
SELECT buyer_email, collection_id FROM club_paid;

ALTER TABLE borsamia_private.product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE borsamia_private.hotmart_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE borsamia_private.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE borsamia_private.collection_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON borsamia_private.product_mappings, borsamia_private.hotmart_events,
  borsamia_private.rate_limits, borsamia_private.collection_files, borsamia_private.current_entitlements
  FROM PUBLIC, anon, authenticated;
COMMIT;
