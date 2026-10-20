import { NextResponse } from "next/server";
import { authenticHotmart, parseHotmart } from "@/lib/hotmart-event";
import { consumeLimit, ingestHotmart } from "@/lib/hotmart-store";
import { limitedJson } from "@/lib/request-body";
import { logger } from "@/lib/logger";
import { deliverWelcomeForEvent } from "@/lib/welcome-delivery";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const secret = process.env.HOTMART_WEBHOOK_SECRET;
  if (process.env.HOTMART_WEBHOOK_ENABLED !== "true" || !secret) {
    return NextResponse.json({ error: "Webhook non configurato" }, { status: 503, headers });
  }
  let body: unknown;
  try { body = await limitedJson(request); }
  catch { return NextResponse.json({ error: "Richiesta non valida" }, { status: 400, headers }); }
  if (!authenticHotmart(request.headers.get("x-hotmart-hottok"), body, secret)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401, headers });
  }
  let event;
  try { event = parseHotmart(body); }
  catch { return NextResponse.json({ error: "Evento non supportato" }, { status: 422, headers }); }
  try {
    if (!await consumeLimit("hotmart:global", 600, 60)) {
      return NextResponse.json({ error: "Riprova più tardi" }, {
        status: 429, headers: { ...headers, "Retry-After": "60" },
      });
    }
    const disposition = await ingestHotmart(event);
    // On a replay, delivery is retried even if the purchase event was already stored.
    const delivery = await deliverWelcomeForEvent(event);
    logger.info({ eventId: event.id, disposition, delivery }, "Hotmart event processed");
    return NextResponse.json({ received: true }, { headers });
  } catch {
    logger.error({ eventId: event.id }, "Hotmart processing unavailable; provider may retry");
    return NextResponse.json({ error: "Servizio non disponibile" }, { status: 503, headers });
  }
}
