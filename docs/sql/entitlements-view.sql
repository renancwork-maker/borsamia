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
