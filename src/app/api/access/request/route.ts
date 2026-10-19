import { NextResponse } from "next/server";
import { z } from "zod";

const RequestAccess = z.object({ email: z.email() });

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!RequestAccess.safeParse(body).success) {
    return NextResponse.json({ message: "Inserisci un indirizzo e-mail valido." }, { status: 400 });
  }
  // Must NEVER confirm purchases or issue login links without actual verified backend.
  return NextResponse.json({ message: "L'accesso non è ancora disponibile. Riprova più tardi." }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
