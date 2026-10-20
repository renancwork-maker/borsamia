-- APPLY ONLY if 001-hotmart.sql from the previous package was already executed.
-- Review after a backup; no existing purchases or events are deleted.
BEGIN;
-- Drop only the legacy check that required plan_id for subscription products.
DO $$
DECLARE old_check record;
BEGIN
  FOR old_check IN
    SELECT conname FROM pg_constraint
    WHERE conrelid='borsamia_private.product_mappings'::regclass AND contype='c'
      AND pg_get_constraintdef(oid) LIKE '%plan_id%'
  LOOP
    EXECUTE format('ALTER TABLE borsamia_private.product_mappings DROP CONSTRAINT %I', old_check.conname);
  END LOOP;
END $$;
UPDATE borsamia_private.product_mappings SET plan_id=NULL WHERE product_id='8765856';
ALTER TABLE borsamia_private.hotmart_events ADD COLUMN IF NOT EXISTS subscription_status text;
ALTER TABLE borsamia_private.hotmart_events ADD COLUMN IF NOT EXISTS parent_transaction text;
CREATE TABLE IF NOT EXISTS borsamia_private.collection_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id text NOT NULL REFERENCES borsamia_private.product_mappings(collection_id),
  title_it text NOT NULL, description_it text,
  file_type text NOT NULL CHECK (file_type IN ('pdf','video')),
  storage_path text NOT NULL UNIQUE, display_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS collection_files_public_idx ON borsamia_private.collection_files (collection_id, visible, display_order);
ALTER TABLE borsamia_private.collection_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON borsamia_private.collection_files FROM PUBLIC, anon, authenticated;
-- Rebuild the entitlement view with paid-period validation (from the canonical view).
DROP VIEW IF EXISTS borsamia_private.current_entitlements;
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
REVOKE ALL ON borsamia_private.current_entitlements FROM PUBLIC, anon, authenticated;
COMMIT;
