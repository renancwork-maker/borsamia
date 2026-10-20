import { NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/admin-policy";
import { customerAuthClient } from "@/lib/customer-auth";
import { consumeLimit, purchasedCollections } from "@/lib/hotmart-store";
import { limitedJson } from "@/lib/request-body";
import { logger } from "@/lib/logger";

const RequestAccess = z.object({ email: z.email().max(254).transform(value => value.trim().toLowerCase()) });
const headers = { "Cache-Control": "no-store" };
const message = "Se ci sono acquisti attivi per questo indirizzo, riceverai un codice di verifica via e-mail. Controlla anche lo spam.";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request.headers.get("origin"), process.env.APP_BASE_URL))
    return NextResponse.json({ message: "Richiesta non consentita." }, { status: 403, headers });
  const body = RequestAccess.safeParse(await limitedJson(request, 2048).catch(() => null));
  if (!body.success) return NextResponse.json({ message: "Inserisci un indirizzo e-mail valido." }, { status: 400, headers });
  try {
    const client = customerAuthClient();
    if (!await consumeLimit("login:global", 30, 60))
      return NextResponse.json({ message: "Riprova tra un minuto." }, { status: 429, headers });
    const permitted = await consumeLimit(`login:${body.data.email}`, 3, 3600);
    const collections = await purchasedCollections(body.data.email);
    if (permitted && collections.length) {
      // The Supabase Auth Magic Link AND Confirm Signup templates must use {{ .Token }}
      // rather than {{ .ConfirmationURL }} to email a numeric code, not a link.
      const result = await client.auth.signInWithOtp({
        email: body.data.email,
        options: { shouldCreateUser: true },
      });
      if (result.error) logger.warn({ event: "customer_code_email_unavailable" }, "Customer verification code could not be sent");
    }
    // Identical message for customers and noncustomers to avoid exposing purchases.
    return NextResponse.json({ message }, { headers });
  } catch {
    return NextResponse.json({ message: "Accesso non disponibile. Riprova più tardi." }, { status: 503, headers });
  }
}
