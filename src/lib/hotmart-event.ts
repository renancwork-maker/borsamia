import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const identifier = z.union([z.string().min(1).max(120), z.number().int().nonnegative()]).transform(String);
const text = z.string().min(1).max(254);
const email = z.email().max(254).transform(value => value.trim().toLowerCase());
const envelope = z.object({
  id: z.uuid(), event: text, version: z.literal("2.0.0"),
  creation_date: z.number().int().positive().optional(),
  creationDate: z.number().int().positive().optional(), data: z.unknown(),
}).refine(value => Boolean(value.creation_date ?? value.creationDate));
const purchase = z.object({
  product: z.object({ id: identifier, sku: text.optional(), ucode: text.optional() }),
  buyer: z.object({ email }),
  purchase: z.object({
    transaction: text, status: text, approved_date: z.number().int().positive().optional(),
    date_next_charge: z.number().int().positive().optional(),
    order_bump: z.object({ is_order_bump: z.boolean(), parent_purchase_transaction: z.string().optional() }).optional(),
  }),
  subscription: z.object({
    plan: z.object({ id: identifier }), subscriber: z.object({ code: text }),
    status: text.optional(),
  }).optional(),
});
const cancellation = z.object({
  product: z.object({ id: identifier }),
  subscriber: z.object({ email, code: text }),
  cancellation_date: z.number().int().positive(),
  date_next_charge: z.number().int().positive().optional(),
  subscription: z.object({ id: identifier, plan: z.object({ id: identifier }) }),
});
const charge = z.object({
  subscription: z.object({
    dateNextCharge: z.iso.datetime(), status: text, product: z.object({ id: identifier }),
  }),
  subscriber: z.object({ email, code: text }), plan: z.object({ id: identifier }),
});
const states: Record<string, string> = {
  PURCHASE_APPROVED: "APPROVED", PURCHASE_COMPLETE: "COMPLETE",
  PURCHASE_REFUNDED: "REFUNDED", PURCHASE_CHARGEBACK: "CHARGEBACK",
  PURCHASE_CANCELED: "CANCELLED", PURCHASE_DELAYED: "OVERDUE",
  PURCHASE_EXPIRED: "EXPIRED",
};

export type HotmartEvent = {
  id: string; event: string; createdAt: number; productId: string; email: string;
  transaction: string | null; state: string; planId: string | null;
  subscriberCode: string | null; subscriptionId: string | null;
  approvedAt: number | null; cancellationAt: number | null; nextCharge: string | null;
  sandbox: boolean;
  subscriptionStatus?: string | null; parentTransaction?: string | null;
};

/** A present, incorrect header must never fall back to a body credential. */
export function authenticHotmart(header: string | null, body: unknown, secret: string): boolean {
  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const received = header ?? (record.event === "UPDATE_SUBSCRIPTION_CHARGE_DATE" ? record.hottok : null);
  if (!secret || typeof received !== "string" || received.length > 1024) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(secret), digest(received));
}

/** Explicit observed variants; all other fields, including tokens and documents, are discarded. */
export function parseHotmart(body: unknown): HotmartEvent {
  const base = envelope.parse(body);
  const common = {
    id: base.id, event: base.event, createdAt: (base.creation_date ?? base.creationDate)!,
    transaction: null, planId: null, subscriberCode: null, subscriptionId: null,
    approvedAt: null, cancellationAt: null, nextCharge: null,
    subscriptionStatus: null, parentTransaction: null,
  };
  if (Object.hasOwn(states, base.event)) {
    const data = purchase.parse(base.data);
    const validStates = base.event === "PURCHASE_CANCELED"
      ? ["CANCELLED", "CANCELED"] : base.event === "PURCHASE_DELAYED"
        ? ["OVERDUE", "DELAYED"] : [states[base.event]];
    if (!validStates.includes(data.purchase.status)) throw new Error("event_status_mismatch");
    return {
      ...common, productId: data.product.id, email: data.buyer.email,
      transaction: data.purchase.transaction, state: data.purchase.status === "CANCELLED" ? "CANCELED"
        : data.purchase.status === "OVERDUE" ? "DELAYED" : data.purchase.status,
      approvedAt: data.purchase.approved_date ?? null,
      nextCharge: data.purchase.date_next_charge ? String(data.purchase.date_next_charge) : null,
      parentTransaction: data.purchase.order_bump?.parent_purchase_transaction || null,
      subscriptionStatus: data.subscription?.status ?? null,
      planId: data.subscription?.plan.id ?? null,
      subscriberCode: data.subscription?.subscriber.code ?? null,
      sandbox: data.product.id === "0" || data.product.sku === "HTM_SANDBOX",
    };
  }
  if (base.event === "SUBSCRIPTION_CANCELLATION") {
    const data = cancellation.parse(base.data);
    return {
      ...common, productId: data.product.id, email: data.subscriber.email, state: "CANCELLED",
      planId: data.subscription.plan.id, subscriptionId: data.subscription.id,
      subscriberCode: data.subscriber.code, cancellationAt: data.cancellation_date,
      subscriptionStatus: "CANCELLED",
      nextCharge: data.date_next_charge ? String(data.date_next_charge) : null,
      sandbox: data.product.id === "0",
    };
  }
  if (base.event === "UPDATE_SUBSCRIPTION_CHARGE_DATE") {
    const data = charge.parse(base.data);
    return {
      ...common, productId: data.subscription.product.id, email: data.subscriber.email,
      state: data.subscription.status, planId: data.plan.id,
      subscriberCode: data.subscriber.code, nextCharge: data.subscription.dateNextCharge,
      subscriptionStatus: data.subscription.status,
      sandbox: data.subscription.product.id === "0",
    };
  }
  throw new Error("unsupported_event");
}
