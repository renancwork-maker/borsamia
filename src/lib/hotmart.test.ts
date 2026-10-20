import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticHotmart, parseHotmart } from "./hotmart-event";
import { limitedJson } from "./request-body";

const mocks = vi.hoisted(() => ({ execute: vi.fn(), info: vi.fn(), error: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({
  getDb: () => ({ execute: mocks.execute, transaction: (callback: (tx: unknown) => unknown) => callback({ execute: mocks.execute }) }),
}));
vi.mock("@/lib/logger", () => ({ logger: { info: mocks.info, error: mocks.error } }));
import { ingestHotmart, consumeLimit } from "./hotmart-store";
import { POST } from "@/app/api/hotmart/webhook/route";

const fixture = () => ({
  id: "00000000-0000-4000-8000-000000000001",
  creation_date: 1792515353529, event: "PURCHASE_APPROVED", version: "2.0.0",
  data: {
    product: { id: 0, sku: "HTM_SANDBOX" },
    buyer: { email: "test@example.com", document: "discard" },
    purchase: { transaction: "TEST-TRANSACTION", status: "APPROVED" },
  },
});
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("HOTMART_WEBHOOK_ENABLED", "true");
  vi.stubEnv("HOTMART_WEBHOOK_SECRET", "test-secret");
});
describe("Hotmart authentication and observed payload variants", () => {
  it("requires a matching header for purchase events", () => {
    expect(authenticHotmart("test-secret", fixture(), "test-secret")).toBe(true);
    expect(authenticHotmart(null, { ...fixture(), hottok: "test-secret" }, "test-secret")).toBe(false);
    expect(authenticHotmart("bad", fixture(), "test-secret")).toBe(false);
  });
  it("supports the charge-update body credential without overriding a bad header", () => {
    const body = { event: "UPDATE_SUBSCRIPTION_CHARGE_DATE", hottok: "test-secret" };
    expect(authenticHotmart(null, body, "test-secret")).toBe(true);
    expect(authenticHotmart("bad", body, "test-secret")).toBe(false);
  });
  it("strips personal documents and credentials and detects sandbox", () => {
    const event = parseHotmart({ ...fixture(), hottok: "discard" });
    expect(event.sandbox).toBe(true);
    expect(JSON.stringify(event)).not.toContain("discard");
  });
  it("parses a real-ID order bump without granting the principal product", () => {
    const payload = fixture();
    payload.data.product = { id: 8765113, sku: "FODERE" };
    Object.assign(payload.data.purchase, {
      order_bump: { is_order_bump: true, parent_purchase_transaction: "HP-PRINCIPAL" },
    });
    const event = parseHotmart(payload);
    expect(event).toMatchObject({ productId: "8765113", parentTransaction: "HP-PRINCIPAL" });
    expect(event.productId).not.toBe("8765000");
  });
  it("recognizes a paid Club renewal only with active subscription and paid period", () => {
    const payload = fixture();
    payload.data.product = { id: 8765856, sku: "CLUB" };
    Object.assign(payload.data.purchase, { date_next_charge: Date.now() + 25 * 86400000 });
    Object.assign(payload.data, { subscription: { status: "ACTIVE", plan: { id: 123 }, subscriber: { code: "SUB-1" } } });
    const event = parseHotmart(payload);
    expect(event).toMatchObject({ productId: "8765856", subscriptionStatus: "ACTIVE", subscriberCode: "SUB-1" });
    expect(Number(event.nextCharge)).toBeGreaterThan(Date.now());
  });
  it("rejects a status that disagrees with the event", () => {
    expect(() => parseHotmart({ ...fixture(), event: "PURCHASE_REFUNDED" })).toThrow();
  });
  it("normalizes cancellation's different subscriber layout", () => {
    const event = parseHotmart({ ...fixture(), event: "SUBSCRIPTION_CANCELLATION", data: {
      product: { id: 8765856 }, subscriber: { email: "test@example.com", code: "TEST" },
      cancellation_date: 1609181285500,
      subscription: { id: 4148584, plan: { id: 1412417 } },
    } });
    expect(event).toMatchObject({ transaction: null, productId: "8765856", state: "CANCELLED" });
  });
  it("normalizes camelCase charge updates without manufacturing a purchase", () => {
    const event = parseHotmart({ ...fixture(), creation_date: undefined, creationDate: 1792515353630,
      event: "UPDATE_SUBSCRIPTION_CHARGE_DATE", data: {
        subscription: { dateNextCharge: "2022-10-25T12:00:00.000Z", status: "ACTIVE", product: { id: 0 } },
        subscriber: { email: "test@example.com", code: "TEST" }, plan: { id: 0 },
      },
    });
    expect(event).toMatchObject({ sandbox: true, transaction: null, approvedAt: null });
  });
  it("rejects unknown events and bodies over the limit", async () => {
    expect(() => parseHotmart({ ...fixture(), event: "UNKNOWN" })).toThrow();
    await expect(limitedJson(new Request("https://example.com", { method: "POST", body: "123456" }), 5)).rejects.toThrow();
  });
});
describe("durable ingestion", () => {
  it("records sandbox events without product grants", async () => {
    mocks.execute.mockResolvedValue({ rows: [] });
    expect(await ingestHotmart(parseHotmart(fixture()))).toBe("sandbox");
  });
  it("quarantines unknown products", async () => {
    const body = fixture(); body.data.product = { id: 999, sku: "TEST" };
    mocks.execute.mockResolvedValue({ rows: [] });
    expect(await ingestHotmart(parseHotmart(body))).toBe("unmapped");
  });
  it("defers subscription access until paid-period evidence is reconciled", async () => {
    const body = fixture(); body.data.product = { id: 8765856, sku: "TEST" };
    const event = { ...parseHotmart(body), planId: "1412417" };
    mocks.execute.mockResolvedValue({ rows: [] })
      .mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ access_kind: "subscription", plan_id: "1412417" }] });
    expect(await ingestHotmart(event)).toBe("needs_reconciliation");
  });
  it("rejects conflicting reuse of event UUID", async () => {
    mocks.execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ fingerprint: "conflict" }] });
    await expect(ingestHotmart(parseHotmart(fixture()))).rejects.toThrow("event_id_conflict");
  });
  it("acknowledges an identical retry without inserting again", async () => {
    const { createHash } = await import("node:crypto");
    const event = parseHotmart(fixture());
    const fingerprint = createHash("sha256").update(JSON.stringify(event)).digest("hex");
    mocks.execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ fingerprint }] });
    expect(await ingestHotmart(event)).toBe("duplicate");
    expect(mocks.execute).toHaveBeenCalledTimes(2);
  });
  it("denies requests beyond the shared limit", async () => {
    mocks.execute.mockResolvedValue({ rows: [{ hits: 601 }] });
    expect(await consumeLimit("test", 600, 60)).toBe(false);
  });
});
describe("HTTP boundary", () => {
  const request = (secret = "test-secret") => new Request("https://example.com/api/hotmart/webhook", {
    method: "POST", headers: { "x-hotmart-hottok": secret }, body: JSON.stringify(fixture()),
  });
  it("fails closed when disabled", async () => {
    vi.stubEnv("HOTMART_WEBHOOK_ENABLED", "false");
    expect((await POST(request())).status).toBe(503);
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("does not touch the database for forged requests", async () => {
    expect((await POST(request("wrong"))).status).toBe(401);
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("keeps persistence failures retryable", async () => {
    mocks.execute.mockRejectedValue(new Error("offline"));
    expect((await POST(request())).status).toBe(503);
  });
  it("returns 429 when limited", async () => {
    mocks.execute.mockResolvedValue({ rows: [{ hits: 601 }] });
    expect((await POST(request())).status).toBe(429);
  });
});
