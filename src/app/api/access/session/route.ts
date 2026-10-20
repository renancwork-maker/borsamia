import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/admin-policy";
import { authorizeCustomer, clearCustomerCookies, customerAuthClient,
  customerCookie, customerRefreshCookie, setCustomerCookies } from "@/lib/customer-auth";
import { purchasedCollections } from "@/lib/hotmart-store";
import { limitedJson } from "@/lib/request-body";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
const SessionRequest = z.object({ email: z.email().max(254).optional() });

/** Restore a previously verified browser session; email alone never creates access. */
export async function POST(request: Request) {
  if (!sameOrigin(request.headers.get("origin"), process.env.APP_BASE_URL))
    return NextResponse.json({ authenticated: false }, { status: 403, headers });
  const body = SessionRequest.safeParse(await limitedJson(request, 2048).catch(() => null));
  if (!body.success) return NextResponse.json({ authenticated: false }, { status: 400, headers });
  const expected = body.data.email?.trim().toLowerCase();
  try {
    const jar = await cookies();
    const access = jar.get(customerCookie)?.value;
    const refresh = jar.get(customerRefreshCookie)?.value;
    let identity = await authorizeCustomer(access);
    if (identity) {
      if (expected && expected !== identity.email) return NextResponse.json({ authenticated: false }, { headers });
      if (!(await purchasedCollections(identity.email)).length) return NextResponse.json({ authenticated: false }, { headers });
      return NextResponse.json({ authenticated: true }, { headers });
    }
    if (!refresh || refresh.length > 16000) return NextResponse.json({ authenticated: false }, { headers });
    const result = await customerAuthClient().auth.refreshSession({ refresh_token: refresh });
    const session = result.data.session;
    identity = !result.error && session?.access_token ? await authorizeCustomer(session.access_token) : null;
    if (!identity || (expected && expected !== identity.email) ||
        !(await purchasedCollections(identity.email)).length) {
      const response = NextResponse.json({ authenticated: false }, { headers });
      // Do not clear cookies if merely switching to another email: the owner may switch back.
      if (!identity) clearCustomerCookies(response);
      return response;
    }
    if (!session?.access_token || !session.refresh_token) return NextResponse.json({ authenticated: false }, { headers });
    const response = NextResponse.json({ authenticated: true }, { headers });
    setCustomerCookies(response, session.access_token, session.refresh_token, identity.expiresAt);
    return response;
  } catch {
    return NextResponse.json({ authenticated: false, message: "Servizio temporaneamente non disponibile." }, { status: 503, headers });
  }
}
