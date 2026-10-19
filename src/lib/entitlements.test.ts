import { describe, expect, it } from "vitest";
import { activeProductIds, type Purchase } from "./entitlements";
const purchases: Purchase[] = [
  { transactionId: "A", email: "Mia@Example.It", productId: "real-product-A", status: "approved" },
  { transactionId: "B", email: "mia@example.it", productId: "real-product-B", status: "approved" },
  { transactionId: "C", email: "mia@example.it", productId: "real-product-C", status: "refunded" },
  { transactionId: "D", email: "altra@example.it", productId: "real-product-D", status: "approved" },
];
describe("commercial access policy", () => {
  it("adds individually approved products without including refunded or other users", () => {
    expect([...activeProductIds(purchases, " mia@example.it ")].sort()).toEqual(["real-product-A", "real-product-B"]);
  });
  it("keeps a product when another transaction for the same product was refunded", () => {
    expect([...activeProductIds([...purchases, { transactionId: "E", email: "mia@example.it", productId: "real-product-A", status: "refunded" }], "mia@example.it")]).toContain("real-product-A");
  });
  it("never admits pending purchases", () => {
    expect(activeProductIds([{ transactionId: "F", email: "mia@example.it", productId: "real-product-X", status: "pending" }], "mia@example.it").size).toBe(0);
  });
});

describe("duplicate and out-of-order events", () => {
  it("never reactivates a refunded transaction, regardless of event order", () => {
    const approved: Purchase = { transactionId: "X", email: "mia@example.it", productId: "main", status: "approved" };
    const refunded: Purchase = { ...approved, status: "refunded" };
    for (const events of [[approved, refunded], [refunded, approved]]) {
      expect(activeProductIds(events, "mia@example.it").size).toBe(0);
    }
  });
  it("blocks conflicting transaction IDs even if one event claims a different buyer", () => {
    const original: Purchase = { transactionId: "T", email: "alice@example.it", productId: "prod", status: "approved" };
    expect(activeProductIds([original, { ...original, email: "bob@example.it" }], "alice@example.it").size).toBe(0);
  });
});
