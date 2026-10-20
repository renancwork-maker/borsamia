import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HotmartEvent } from "./hotmart-event";

const mocks = vi.hoisted(() => ({ execute: vi.fn(), collections: vi.fn(), send: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ getDb: () => ({ execute: mocks.execute }) }));
vi.mock("@/lib/hotmart-store", () => ({ purchasedCollections: mocks.collections }));
vi.mock("@/lib/resend-email", () => ({ sendWelcomeEmail: mocks.send }));
import { deliverWelcomeForEvent } from "./welcome-delivery";
const event = (): HotmartEvent => ({
  id: "00000000-0000-4000-8000-000000000004",
  event: "PURCHASE_APPROVED", createdAt: 1792515353529, productId: "8765113",
  email: "cliente@example.com", transaction: "T-BUMP", state: "APPROVED",
  planId: null, subscriberCode: null, subscriptionId: null, approvedAt: null,
  cancellationAt: null, nextCharge: null, sandbox: false,
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.execute.mockResolvedValue({ rows: [] });
  mocks.collections.mockResolvedValue(["borse", "fodere"]);
  mocks.send.mockResolvedValue("resend-id");
});
describe("verified Hotmart purchase -> Resend", () => {
  it("never emails sandbox, refunded, or unknown products", async () => {
    expect(await deliverWelcomeForEvent({ ...event(), sandbox: true })).toBe("skipped");
    expect(await deliverWelcomeForEvent({ ...event(), state: "REFUNDED" })).toBe("skipped");
    expect(await deliverWelcomeForEvent({ ...event(), productId: "unknown" })).toBe("skipped");
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("sends current paid collections, including an order bump", async () => {
    mocks.execute.mockResolvedValueOnce({ rows: [] }) // create outbox row
      .mockResolvedValueOnce({ rows: [{ event_id: event().id }] }) // claim
      .mockResolvedValueOnce({ rows: [] }); // mark sent
    expect(await deliverWelcomeForEvent(event())).toBe("sent");
    expect(mocks.send).toHaveBeenCalledWith({
      transaction: "T-BUMP", productId: "8765113", email: "cliente@example.com",
      collectionIds: ["borse", "fodere"],
    });
  });
  it("does not resend an already-sent or in-progress transaction", async () => {
    mocks.execute.mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ status: "sent" }] });
    expect(await deliverWelcomeForEvent(event())).toBe("already_sent");
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("does not send after a refund or access revocation", async () => {
    mocks.collections.mockResolvedValue(["borse"]);
    mocks.execute.mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ event_id: event().id }] })
      .mockResolvedValueOnce({ rows: [] });
    expect(await deliverWelcomeForEvent(event())).toBe("skipped");
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("returns to pending on Resend failure so Hotmart can retry", async () => {
    mocks.execute.mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ event_id: event().id }] })
      .mockResolvedValueOnce({ rows: [] });
    mocks.send.mockRejectedValue(new Error("resend_http_429"));
    await expect(deliverWelcomeForEvent(event())).rejects.toThrow("resend_http_429");
    expect(mocks.execute).toHaveBeenCalledTimes(3);
  });
});
