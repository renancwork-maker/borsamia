import { NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/admin-policy";
import { authorizeCustomer, customerAuthClient, setCustomerCookies } from "@/lib/customer-auth";
import { consumeLimit, purchasedCollections } from "@/lib/hotmart-store";
import { limitedJson } from "@/lib/request-body";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
const Confirmation = z.object({
  email: z.email().max(254).transform(value => value.trim().toLowerCase()),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  if (!sameOrigin(request.headers.get("origin"), process.env.APP_BASE_URL))
    return NextResponse.json({ message: "Richiesta non consentita." }, { status: 403, headers });
  const body = Confirmation.safeParse(await limitedJson(request, 2048).catch(() => null));
  if (!body.success) return NextResponse.json({ message: "Inserisci il codice di 6 cifre ricevuto via e-mail." }, { status: 400, headers });
  try {
    const client = customerAuthClient();
    if (!await consumeLimit("confirm:global", 60, 60) ||
        !await consumeLimit(`confirm:${body.data.email}`, 10, 3600))
      return NextResponse.json({ message: "Troppi tentativi. Riprova più tardi." }, { status: 429, headers });
    const result = await client.auth.verifyOtp({ email: body.data.email, token: body.data.code, type: "email" });
    const session = result.data.session;
    const identity = result.error || !session?.access_token ? null : await authorizeCustomer(session.access_token);
    if (!identity || identity.email !== body.data.email || !session?.refresh_token ||
        !(await purchasedCollections(identity.email)).length)
      return NextResponse.json({ message: "Codice scaduto o non valido. Richiedi un nuovo codice." }, { status: 403, headers });
    const response = NextResponse.json({ ok: true }, { headers });
    setCustomerCookies(response, session.access_token, session.refresh_token, identity.expiresAt);
    return response;
  } catch {
    return NextResponse.json({ message: "Accesso non disponibile. Riprova più tardi." }, { status: 503, headers });
  }
}
