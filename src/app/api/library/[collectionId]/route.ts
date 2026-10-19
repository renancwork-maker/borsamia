import { NextResponse } from "next/server";

/** Protected placeholder: never emit private storage paths without session and entitlement. */
export async function GET(_request: Request, _context: { params: Promise<{ collectionId: string }> }) {
  return NextResponse.json({ message: "Accesso non autorizzato" }, { status: 401, headers: { "Cache-Control": "no-store" } });
}
