import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authorizeCustomer, customerCookie } from "@/lib/customer-auth";
import { purchasedCollections } from "@/lib/hotmart-store";
import { productPages } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function PurchasedLibrary() {
  let purchased: string[];
  try {
    const identity = await authorizeCustomer((await cookies()).get(customerCookie)?.value);
    if (!identity) redirect("/accedi");
    purchased = await purchasedCollections(identity.email);
  } catch (error) {
    // Next.js redirect throws an internal sentinel that must not be swallowed.
    if (error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")) throw error;
    return <main className="login-page"><h1>Biblioteca temporaneamente non disponibile</h1>
      <p>Riprova tra qualche istante.</p><Link href="/accedi">Torna all’accesso</Link></main>;
  }
  return <div className="product-layout library-layout"><header className="product-header"><Link href="/" className="brand-text">Borsa<span>Mia</span></Link><Link href="/">Esplora BorsaMia</Link></header>
    <main className="library-main"><p className="eyebrow">IL TUO ANGOLO CREATIVO</p>
      <h1>La tua biblioteca, le tue idee.</h1><p className="library-intro">Ritrova le collezioni incluse nei tuoi acquisti e scopri nuove ispirazioni. I materiali sono protetti e accessibili solo dal tuo account.</p>
      <div className="library-filter"><span>{purchased.length} collezioni attive</span><span>{productPages.length} collezioni disponibili</span></div>
      <div className="library-grid">{productPages.map(product => {
        const active = purchased.includes(product.collectionId);
        return <article key={product.slug} className="library-card">
          <Link href={`/prodotti/${product.slug}`} className="library-card-cover"><Image src={product.image} width={760} height={507} alt={product.alt} sizes="(max-width: 720px) 100vw, 40vw" />
            <span className={active ? "access-pill available" : "access-pill"}>{active ? "✓ Disponibile" : "♧ Non acquistata"}</span></Link>
          <div className="library-card-body"><h2>{product.title}</h2><p>{product.subtitle}</p>
            <Link href={`/prodotti/${product.slug}`} className="library-card-link">{active ? "Apri la collezione →" : "Scopri la collezione →"}</Link></div>
        </article>;
      })}</div>
      {!purchased.length && <p className="library-notice">Non risultano acquisti attivi per questo indirizzo e-mail. Se hai appena acquistato, attendi la conferma del pagamento e riprova.</p>}
    </main><footer className="product-footer">BorsaMia · Fatto con amore e cura</footer>
  </div>;
}
