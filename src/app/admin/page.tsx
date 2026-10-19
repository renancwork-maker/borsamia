import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminCookie, authorizeAdmin } from "@/lib/admin-auth";
import AdminLogout from "@/components/admin-logout";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminPage() {
  let admin;
  try { admin = await authorizeAdmin((await cookies()).get(adminCookie)?.value); }
  catch { logger.warn({ event: "admin_page_unavailable" }, "Administrative access failed closed"); }
  if (!admin) redirect("/admin/accedi");
  return <main className="login-page"><section className="login-content">
    <h1>Amministrazione BorsaMia</h1>
    <p>Identità, secondo fattore e autorizzazione verificati.</p>
    <p>La gestione di clienti, acquisti e documenti non è ancora disponibile. Nessun dato commerciale viene mostrato in questa versione.</p>
    <AdminLogout />
  </section></main>;
}
