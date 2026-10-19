export function validAdminClaims(claims: { sub?: unknown; aal?: unknown; exp?: unknown; session_id?: unknown }, now = Date.now()) {
  return typeof claims.sub === "string" && claims.aal === "aal2" &&
    typeof claims.exp === "number" && claims.exp * 1000 > now &&
    typeof claims.session_id === "string";
}

export function sameOrigin(origin: string | null, expected: string | undefined) {
  if (!origin || !expected) return false;
  try { return origin === new URL(expected).origin; } catch { return false; }
}
