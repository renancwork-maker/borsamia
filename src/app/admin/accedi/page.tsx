import Link from "next/link";
import AdminLogin from "@/components/admin-login";
import { adminConfig } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  const config = adminConfig();
  return <main className="login-page"><section className="login-content">
    <h1>Accesso amministrativo</h1>
    <p>Accedi con la password e il codice della tua app di autenticazione.</p>
    {config ? <AdminLogin url={config.url} publishableKey={config.key} /> : <p role="status">Accesso amministrativo non ancora configurato.</p>}
    <Link href="/">Torna alla biblioteca</Link>
  </section></main>;
}
