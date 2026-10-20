import { NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/admin-policy";
import { authorizeCustomer, customerAuthClient, customerCookie } from "@/lib/customer-auth";
import { consumeLimit, purchasedCollections } from "@/lib/hotmart-store";
import { limitedJson } from "@/lib/request-body";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
export async function POST(request: Request) {
  if (!sameOrigin(request.headers.get("origin"), process.env.APP_BASE_URL))
    return NextResponse.json({ message: "Richiesta non consentita." }, { status: 403, headers });
  const body = z.object({ token: z.string().min(20).max(512) })
    .safeParse(await limitedJson(request, 2048).catch(() => null));
  if (!body.success) return NextResponse.json({ message: "Link non valido." }, { status: 400, headers });
  try {
    const client = customerAuthClient();
    if (!await consumeLimit("confirm:global", 60, 60))
      return NextResponse.json({ message: "Riprova tra un minuto." }, { status: 429, headers });
    const result = await client.auth.verifyOtp({ token_hash: body.data.token, type: "email" });
    const token = result.data.session?.access_token;
    const identity = result.error ? null : await authorizeCustomer(token);
    if (!identity || !token || !(await purchasedCollections(identity.email)).length) {
      return NextResponse.json({ message: "Link scaduto o accesso non disponibile. Richiedi un nuovo link." }, { status: 403, headers });
    }
    const response = NextResponse.json({ ok: true }, { headers });
    response.cookies.set(customerCookie, token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/",
      maxAge: Math.max(0, Math.min(3600, identity.expiresAt - Math.floor(Date.now() / 1000))),
    });
    return response;
  } catch {
    return NextResponse.json({ message: "Accesso non disponibile. Riprova più tardi." }, { status: 503, headers });
  }
}
