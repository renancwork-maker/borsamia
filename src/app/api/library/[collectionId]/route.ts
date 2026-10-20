import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authorizeCustomer, customerCookie } from "@/lib/customer-auth";
import { purchasedCollections } from "@/lib/hotmart-store";
import { collectionFiles } from "@/lib/collection-files";
import { findCollection } from "@/lib/catalog";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function GET(_request: Request, { params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = await params;
  if (!findCollection(collectionId)) return NextResponse.json({ message: "Collezione sconosciuta" }, { status: 404, headers });
  try {
    const identity = await authorizeCustomer((await cookies()).get(customerCookie)?.value);
    if (!identity) return NextResponse.json({ message: "Accedi per continuare" }, { status: 401, headers });
    if (!(await purchasedCollections(identity.email)).includes(collectionId))
      return NextResponse.json({ message: "Collezione non inclusa nel tuo acquisto" }, { status: 403, headers });
    return NextResponse.json({ files: await collectionFiles(collectionId) }, { headers });
  } catch {
    return NextResponse.json({ message: "Servizio temporaneamente non disponibile" }, { status: 503, headers });
  }
}
