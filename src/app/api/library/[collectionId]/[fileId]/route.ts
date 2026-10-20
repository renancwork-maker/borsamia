import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { authorizeCustomer, customerCookie } from "@/lib/customer-auth";
import { purchasedCollections } from "@/lib/hotmart-store";
import { findCollection } from "@/lib/catalog";
import { collectionFilePath } from "@/lib/collection-files";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(_request: Request, { params }: { params: Promise<{ collectionId: string; fileId: string }> }) {
  const { collectionId, fileId } = await params;
  if (!findCollection(collectionId) || !z.uuid().safeParse(fileId).success)
    return NextResponse.json({ message: "Contenuto non trovato" }, { status: 404, headers });
  try {
    const identity = await authorizeCustomer((await cookies()).get(customerCookie)?.value);
    if (!identity) return NextResponse.json({ message: "Accesso richiesto" }, { status: 401, headers });
    if (!(await purchasedCollections(identity.email)).includes(collectionId))
      return NextResponse.json({ message: "Contenuto non incluso nel tuo acquisto" }, { status: 403, headers });
    const path = await collectionFilePath(collectionId, fileId);
    if (!path) return NextResponse.json({ message: "Contenuto non trovato" }, { status: 404, headers });
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("storage_unavailable");
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await client.storage.from("borsamia-content")
      .createSignedUrl(path, 90);
    if (error || !data?.signedUrl) throw new Error("file_unavailable");
    const signedUrl = new URL(data.signedUrl);
    if (signedUrl.origin !== new URL(url).origin || signedUrl.protocol !== "https:") throw new Error("invalid_storage_url");
    return NextResponse.redirect(signedUrl, { status: 307, headers });
  } catch {
    return NextResponse.json({ message: "File temporaneamente non disponibile" }, { status: 503, headers });
  }
}
