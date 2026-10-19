import { NextResponse } from "next/server";

/** Intentionally inert until Hotmart's live event format and credentials are verified. */
export async function POST(_request: Request) {
  // Fail closed. No incoming browser/webhook JSON can create entitlements yet.
  return NextResponse.json({ error: "Webhook non configurato" }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
