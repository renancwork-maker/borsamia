import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claims: vi.fn(), user: vi.fn(), execute: vi.fn(), send: vi.fn(), verify: vi.fn(), refresh: vi.fn(),
  limit: vi.fn(), collections: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ getDb: () => ({ execute: mocks.execute }) }));
vi.mock("@/lib/hotmart-store", () => ({ consumeLimit: mocks.limit, purchasedCollections: mocks.collections }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn() } }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: {
    getClaims: mocks.claims, getUser: mocks.user, signInWithOtp: mocks.send,
    verifyOtp: mocks.verify, refreshSession: mocks.refresh,
  } }),
}));
import { authorizeCustomer } from "./customer-auth";
import { POST as requestAccess } from "@/app/api/access/request/route";
import { POST as confirmAccess } from "@/app/api/access/confirm/route";
import { POST as restoreSession } from "@/app/api/access/session/route";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CUSTOMER_ACCESS_ENABLED", "true");
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost/test");
  vi.stubEnv("APP_BASE_URL", "https://example.com");
  mocks.claims.mockResolvedValue({ data: { claims: {
    sub: "user", session_id: "session", exp: Math.floor(Date.now() / 1000) + 300,
  } } });
  mocks.user.mockResolvedValue({ data: { user: { id: "user", email: "test@example.com", email_confirmed_at: "2026-01-01" } } });
  mocks.execute.mockResolvedValue({ rows: [{ id: "session" }] });
  mocks.limit.mockResolvedValue(true);
  mocks.collections.mockResolvedValue(["borse"]);
  mocks.send.mockResolvedValue({ error: null });
  mocks.verify.mockResolvedValue({ data: { session: { access_token: "signed-token", refresh_token: "refresh-token" } } });
  mocks.refresh.mockResolvedValue({ error: null, data: { session: { access_token: "signed-token", refresh_token: "refresh-token" } } });
});
const request = (body: unknown, origin = "https://example.com") => new Request("https://example.com/api/access", {
  method: "POST", headers: { origin }, body: JSON.stringify(body),
});
it("rejects absent, expired or forged customer sessions", async () => {
  expect(await authorizeCustomer(undefined)).toBeNull();
  mocks.claims.mockResolvedValue({ error: new Error("signature") });
  expect(await authorizeCustomer("bad")).toBeNull();
  mocks.claims.mockResolvedValue({ data: { claims: { sub: "user", session_id: "session", exp: 1 } } });
  expect(await authorizeCustomer("expired")).toBeNull();
});
it("rejects unconfirmed email and revoked Auth sessions", async () => {
  mocks.execute.mockResolvedValue({ rows: [] });
  expect(await authorizeCustomer("signed-token")).toBeNull();
  mocks.execute.mockResolvedValue({ rows: [{ id: "session" }] });
  mocks.user.mockResolvedValue({ data: { user: { id: "user", email: "test@example.com" } } });
  expect(await authorizeCustomer("signed-token")).toBeNull();
});
it("does not disclose whether an email has purchases", async () => {
  const known = await requestAccess(request({ email: "test@example.com" }));
  mocks.collections.mockResolvedValue([]);
  const unknown = await requestAccess(request({ email: "other@example.com" }));
  expect(await known.json()).toEqual(await unknown.json());
  expect(mocks.send).toHaveBeenCalledTimes(1);
});
it("rejects cross-origin access", async () => {
  expect((await requestAccess(request({ email: "test@example.com" }, "https://evil.example"))).status).toBe(403);
  expect((await confirmAccess(request({ email: "test@example.com", code: "123456" }, "https://evil.example"))).status).toBe(403);
  expect((await restoreSession(request({}, "https://evil.example"))).status).toBe(403);
  expect(mocks.verify).not.toHaveBeenCalled();
});
it("does not send OTP after per-email throttling", async () => {
  mocks.limit.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  expect((await requestAccess(request({ email: "test@example.com" }))).status).toBe(200);
  expect(mocks.send).not.toHaveBeenCalled();
});
it("verifies a numeric code and sets HttpOnly access and refresh cookies", async () => {
  const response = await confirmAccess(request({ email: "test@example.com", code: "123456" }));
  expect(response.status).toBe(200);
  expect(mocks.verify).toHaveBeenCalledWith({ email: "test@example.com", token: "123456", type: "email" });
  expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  expect(response.cookies.getAll().map(x => x.name).sort()).toEqual(["borsamia_customer", "borsamia_customer_refresh"]);
  mocks.collections.mockResolvedValue([]);
  const denied = await confirmAccess(request({ email: "test@example.com", code: "123456" }));
  expect(denied.status).toBe(403);
  expect(denied.headers.get("set-cookie")).toBeNull();
});
it("never accepts a link token or guesses instead of a six-digit code", async () => {
  expect((await confirmAccess(request({ email: "test@example.com", code: "aaaaaaaaaaaaaa" }))).status).toBe(400);
  expect((await confirmAccess(request({ email: "test@example.com", code: "12345" }))).status).toBe(400);
  expect(mocks.verify).not.toHaveBeenCalled();
});
it("fails closed when database permission lookup fails", async () => {
  mocks.collections.mockRejectedValue(new Error("offline"));
  expect((await confirmAccess(request({ email: "test@example.com", code: "123456" }))).status).toBe(503);
});
it("does not grant a session merely because an email was entered", async () => {
  const response = await restoreSession(request({ email: "test@example.com" }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ authenticated: false });
  expect(mocks.verify).not.toHaveBeenCalled();
});
