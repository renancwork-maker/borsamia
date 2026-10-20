import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { productPages } from "@/lib/catalog";
import { sendWelcomeEmail } from "@/lib/resend-email";
import { purchasedCollections } from "@/lib/hotmart-store";
import type { HotmartEvent } from "@/lib/hotmart-event";

/**
 * Only verified, persisted and currently entitled purchases can trigger mail.
 * The database claim prevents overlapping callbacks from sending the same event.
 * The provider idempotency key also survives short retries after a network timeout.
 */
export async function deliverWelcomeForEvent(event: HotmartEvent): Promise<"sent" | "already_sent" | "busy" | "skipped"> {
  if (event.sandbox || !event.transaction || !["APPROVED", "COMPLETE"].includes(event.state)) return "skipped";
  const expectedCollection = productPages.find(product => product.hotmartId === event.productId)?.collectionId;
  if (!expectedCollection) return "skipped";

  const db = getDb();
  await db.execute(sql`
    INSERT INTO borsamia_private.welcome_deliveries (event_id, transaction_id, product_id)
    SELECT event_id, transaction_id, product_id FROM borsamia_private.hotmart_events
    WHERE event_id = ${event.id}::uuid AND product_id = ${event.productId}
      AND buyer_email = ${event.email} AND transaction_id = ${event.transaction}
      AND disposition = 'recorded'
      AND purchase_state IN ('APPROVED','COMPLETE')
    ON CONFLICT DO NOTHING
  `);
  const claim = await db.execute(sql`
    UPDATE borsamia_private.welcome_deliveries
    SET status = 'sending', attempts = attempts + 1, locked_at = now()
    WHERE transaction_id = ${event.transaction} AND product_id = ${event.productId} AND (
      status = 'pending' OR (status = 'sending' AND locked_at < now() - interval '5 minutes')
    )
    RETURNING event_id
  `);
  if (!claim.rows.length) {
    const prior = await db.execute(sql`
      SELECT status FROM borsamia_private.welcome_deliveries
      WHERE transaction_id = ${event.transaction} AND product_id = ${event.productId}
    `);
    return prior.rows[0]?.status === "sent" ? "already_sent" : prior.rows.length ? "busy" : "skipped";
  }

  try {
    const active = await purchasedCollections(event.email);
    // Avoid sending a payment confirmation for an entitlement already revoked.
    if (!active.includes(expectedCollection)) {
      await db.execute(sql`
        UPDATE borsamia_private.welcome_deliveries
        SET status = 'cancelled', locked_at = NULL
        WHERE transaction_id = ${event.transaction} AND product_id = ${event.productId}
          AND status = 'sending'
      `);
      return "skipped";
    }
    // The email enumerates ALL currently paid collections, including order bumps
    // whose individual Hotmart events have arrived already.
    const providerId = await sendWelcomeEmail({
      transaction: event.transaction, productId: event.productId,
      email: event.email, collectionIds: active,
    });
    await db.execute(sql`
      UPDATE borsamia_private.welcome_deliveries
      SET status = 'sent', sent_at = now(), locked_at = NULL, provider_id = ${providerId}
      WHERE transaction_id = ${event.transaction} AND product_id = ${event.productId}
          AND status = 'sending'
    `);
    return "sent";
  } catch (error) {
    // Do not store or log the recipient, credentials, or provider payload.
    await db.execute(sql`
      UPDATE borsamia_private.welcome_deliveries
      SET status = 'pending', locked_at = NULL
      WHERE transaction_id = ${event.transaction} AND product_id = ${event.productId}
          AND status = 'sending'
    `).catch(() => {});
    throw error;
  }
}
