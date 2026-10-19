/** Commercial policy for normalized verified transaction records, not raw webhooks. */
export type CommercialStatus = "approved" | "refunded" | "chargeback" | "cancelled" | "pending";
export type Purchase = {
  transactionId: string;
  email: string;
  productId: string;
  status: CommercialStatus;
};

export function normalizedEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Repeated events for the same transaction cannot reactivate a refund.
 * The real ingestion layer must additionally verify event authenticity,
 * preserve identifiers, and reconcile true Hotmart status via its API.
 */
export function activeProductIds(purchases: readonly Purchase[], email: string): Set<string> {
  const expected = normalizedEmail(email);
  const byTransaction = new Map<string, { email: string; productId: string; revoked: boolean; approved: boolean; consistent: boolean }>();
  for (const p of purchases) {
    if (!p.transactionId || !p.productId || !p.email) continue;
    const buyer = normalizedEmail(p.email);
    const previous = byTransaction.get(p.transactionId);
    if (!previous) {
      byTransaction.set(p.transactionId, {
        email: buyer, productId: p.productId, revoked: p.status === "refunded" || p.status === "chargeback" || p.status === "cancelled",
        approved: p.status === "approved", consistent: true,
      });
    } else {
      previous.consistent &&= previous.email === buyer && previous.productId === p.productId;
      previous.revoked ||= p.status === "refunded" || p.status === "chargeback" || p.status === "cancelled";
      previous.approved ||= p.status === "approved";
    }
  }
  return new Set([...byTransaction.values()]
    .filter(p => p.consistent && p.email === expected && p.approved && !p.revoked)
    .map(p => p.productId));
}
