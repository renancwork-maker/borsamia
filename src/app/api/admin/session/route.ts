import { NextRequest, NextResponse } from "next/server";
import { adminConfig, adminCookie, authorizeAdmin } from "@/lib/admin-auth";
import { sameOrigin } from "@/lib/admin-policy";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  if (!sameOrigin(request.headers.get("origin"), process.env.APP_BASE_URL))
    return NextResponse.json({ message: "Richiesta non consentita." }, { status: 403, headers });
  if (!adminConfig()) return NextResponse.json({ message: "Accesso non disponibile." }, { status: 503, headers });
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  try {
    const admin = await authorizeAdmin(token);
    if (!admin || !token) return NextResponse.json({ message: "Accesso non autorizzato. Verifica il secondo fattore e i permessi." }, { status: 403, headers });
    const response = NextResponse.json({ ok: true }, { headers });
    response.cookies.set(adminCookie, token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict",
      path: "/", maxAge: Math.max(0, Math.min(3600, admin.expiresAt - Math.floor(Date.now() / 1000))),
    });
    logger.info({ event: "admin_login", userId: admin.userId }, "Administrative login");
    return response;
  } catch {
    logger.warn({ event: "admin_auth_unavailable" }, "Administrative authentication failed closed");
    return NextResponse.json({ message: "Accesso non disponibile. Riprova più tardi." }, { status: 503, headers });
  }
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request.headers.get("origin"), process.env.APP_BASE_URL))
    return NextResponse.json({ message: "Richiesta non consentita." }, { status: 403, headers });
  const config = adminConfig();
  const token = request.cookies.get(adminCookie)?.value;
  let revoked = true;
  if (config && token) {
    try {
      const result = await fetch(`${config.url}/auth/v1/logout?scope=local`, {
        method: "POST", headers: { apikey: config.key, Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000), cache: "no-store",
      });
      revoked = result.ok || result.status === 401 || result.status === 403;
    } catch { revoked = false; }
  }
  const response = NextResponse.json({ ok: revoked }, { status: revoked ? 200 : 503, headers });
  response.cookies.set(adminCookie, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" });
  return response;
}
