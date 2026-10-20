import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import type { HotmartEvent } from "@/lib/hotmart-event";

export async function consumeLimit(key: string, maximum: number, seconds: number): Promise<boolean> {
  const hashed = createHash("sha256").update(key).digest("hex");
  const result = await getDb().execute(sql`
    INSERT INTO borsamia_private.rate_limits (key, started_at, hits) VALUES (${hashed}, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
      hits = CASE WHEN rate_limits.started_at < now() - ${seconds} * interval '1 second'
        THEN 1 ELSE rate_limits.hits + 1 END,
      started_at = CASE WHEN rate_limits.started_at < now() - ${seconds} * interval '1 second'
        THEN now() ELSE rate_limits.started_at END
    RETURNING hits
  `);
  return Number(result.rows[0]?.hits) <= maximum;
}

export async function ingestHotmart(event: HotmartEvent): Promise<string> {
  return getDb().transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${event.id}, 0))`);
    const fingerprint = createHash("sha256").update(JSON.stringify(event)).digest("hex");
    const existing = await tx.execute(sql`
      SELECT fingerprint FROM borsamia_private.hotmart_events WHERE event_id = ${event.id}::uuid
    `);
    if (existing.rows.length) {
      if (existing.rows[0].fingerprint !== fingerprint) throw new Error("event_id_conflict");
      return "duplicate";
    }
    const mapping = await tx.execute(sql`
      SELECT access_kind, plan_id FROM borsamia_private.product_mappings
      WHERE product_id = ${event.productId} AND enabled = true
    `);
    const product = mapping.rows[0];
    // Unverified plan IDs and date-only changes must never grant subscription access.
    const paidClub = product?.access_kind === "subscription" &&
      (event.state === "APPROVED" || event.state === "COMPLETE") &&
      event.subscriptionStatus === "ACTIVE" && Boolean(event.subscriberCode) &&
      Boolean(event.transaction) && Boolean(event.nextCharge) &&
      /^\d{13}$/.test(event.nextCharge ?? "") &&
      Number(event.nextCharge) > Date.now() &&
      Number(event.nextCharge) <= Date.now() + 65 * 86_400_000;
    const disposition = event.sandbox ? "sandbox" : !product ? "unmapped"
      : product.access_kind === "subscription"
        ? product.plan_id && product.plan_id !== event.planId ? "plan_mismatch"
          : paidClub ? "recorded" : "needs_reconciliation"
        : event.transaction ? "recorded" : "needs_reconciliation";
    await tx.execute(sql`
      INSERT INTO borsamia_private.hotmart_events
        (event_id, fingerprint, event_type, occurred_at, product_id, buyer_email,
         transaction_id, purchase_state, plan_id, subscriber_code, subscription_id,
         approved_at, cancellation_at, next_charge, disposition,
         subscription_status, parent_transaction)
      VALUES (${event.id}::uuid, ${fingerprint}, ${event.event}, ${event.createdAt},
        ${event.productId}, ${event.email}, ${event.transaction}, ${event.state},
        ${event.planId}, ${event.subscriberCode}, ${event.subscriptionId},
        ${event.approvedAt}, ${event.cancellationAt}, ${event.nextCharge}, ${disposition},
        ${event.subscriptionStatus ?? null}, ${event.parentTransaction ?? null})
    `);
    return disposition;
  });
}

/** Call only after verifying the customer's identity on the server. */
export async function purchasedCollections(email: string): Promise<string[]> {
  const result = await getDb().execute(sql`
    SELECT collection_id FROM borsamia_private.current_entitlements
    WHERE buyer_email = ${email.trim().toLowerCase()}
  `);
  return result.rows.map(row => String(row.collection_id));
}
