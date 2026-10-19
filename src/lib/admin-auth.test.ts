import { beforeEach, describe, expect, it, vi } from "vitest";
import { sameOrigin, validAdminClaims } from "./admin-policy";

const mocks = vi.hoisted(() => ({ claims: vi.fn(), user: vi.fn(), execute: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ getDb: () => ({ execute: mocks.execute }) }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { getClaims: mocks.claims, getUser: mocks.user } }) }));
import { authorizeAdmin, adminConfig } from "./admin-auth";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost/test");
  vi.stubEnv("APP_BASE_URL", "https://example.com");
  mocks.claims.mockResolvedValue({ data: { claims: { sub: "user", aal: "aal2", exp: Math.floor(Date.now() / 1000) + 300, session_id: "session" } }, error: null });
  mocks.user.mockResolvedValue({ data: { user: { id: "user" } }, error: null });
  mocks.execute.mockResolvedValue({ rows: [{ user_id: "user" }] });
});

describe("administrative authorization", () => {
  it("accepts verified MFA and an active database membership/session", async () => {
    expect(await authorizeAdmin("token")).toMatchObject({ userId: "user" });
  });
  it("denies absent tokens", async () => {
    expect(await authorizeAdmin(undefined)).toBeNull();
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("denies tampered tokens", async () => {
    mocks.claims.mockResolvedValue({ data: null, error: new Error("signature") });
    expect(await authorizeAdmin("tampered")).toBeNull();
  });
  it("denies missing MFA", async () => {
    mocks.claims.mockResolvedValue({ data: { claims: { sub: "user", aal: "aal1", exp: 9999999999, session_id: "session" } } });
    expect(await authorizeAdmin("token")).toBeNull();
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("denies revoked membership or a removed session", async () => {
    mocks.execute.mockResolvedValue({ rows: [] });
    expect(await authorizeAdmin("token")).toBeNull();
  });
  it("does not cache administrative permission", async () => {
    expect(await authorizeAdmin("token")).not.toBeNull();
    mocks.execute.mockResolvedValue({ rows: [] });
    expect(await authorizeAdmin("token")).toBeNull();
  });
  it("fails closed when database is unavailable", async () => {
    mocks.execute.mockRejectedValue(new Error("offline"));
    await expect(authorizeAdmin("token")).rejects.toThrow("offline");
  });
  it("rejects an Auth lookup failure", async () => {
    mocks.user.mockResolvedValue({ error: new Error("disabled") });
    expect(await authorizeAdmin("token")).toBeNull();
  });
  it("never sends a secret key to the login page", () => {
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_secret_example");
    expect(adminConfig()).toBeNull();
  });
  it("denies expired claims", () => {
    expect(validAdminClaims({ sub: "user", aal: "aal2", exp: 1, session_id: "session" })).toBe(false);
  });
  it("blocks cross-origin and missing-origin mutations", () => {
    expect(sameOrigin("https://evil.example", "https://example.com")).toBe(false);
    expect(sameOrigin(null, "https://example.com")).toBe(false);
    expect(sameOrigin("https://example.com", "https://example.com")).toBe(true);
  });
});
