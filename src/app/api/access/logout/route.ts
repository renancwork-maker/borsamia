import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/admin-policy";
import { clearCustomerCookies } from "@/lib/customer-auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request.headers.get("origin"), process.env.APP_BASE_URL))
    return NextResponse.json({ ok: false }, { status: 403 });
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  clearCustomerCookies(response);
  return response;
}
