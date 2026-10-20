import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { authorizeCustomer, customerCookie } from "@/lib/customer-auth";
import { purchasedCollections } from "@/lib/hotmart-store";
import { collectionFiles } from "@/lib/collection-files";
import { findProduct, productPages } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export function generateStaticParams() { return productPages.map(({ slug }) => ({ slug })); }

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();
  let authenticated = false;
  let purchased = false;
  let files: Awaited<ReturnType<typeof collectionFiles>> = [];
  let unavailable = false;
  try {
    const identity = await authorizeCustomer((await cookies()).get(customerCookie)?.value);
    if (identity) {
      authenticated = true;
      purchased = (await purchasedCollections(identity.email)).includes(product.collectionId);
      if (purchased) files = await collectionFiles(product.collectionId);
    }
  } catch { unavailable = true; }
  return <div className="product-layout">
    <header className="product-header"><Link href="/" className="brand-text">Borsa<span>Mia</span></Link>
      <nav aria-label="Navigazione"><Link href="/biblioteca">La mia biblioteca</Link><Link className="header-access" href="/accedi">Accedi</Link></nav>
    </header>
    <main className="product-main">
      <div className="product-hero">
        <div className="product-picture"><Image src={product.image} alt={product.alt} width={900} height={610} priority sizes="(max-width: 800px) 100vw, 48vw" />
          <span className="picture-tag">BorsaMia · Immagine illustrativa</span></div>
        <div className="product-copy"><p className="eyebrow">{product.eyebrow}</p>
          <h1>{product.title}</h1><p className="product-lead">{product.subtitle}</p>
          <p className="product-description">{product.description}</p>
          <ul className="product-highlights">{product.points.map(point => <li key={point}><span aria-hidden="true">✓</span>{point}</li>)}</ul>
          {purchased ? <div className="product-permission active" role="status"><span aria-hidden="true">✓</span> Collezione inclusa nei tuoi acquisti.</div>
            : <div className="product-permission" role="status">{authenticated ? "Questa collezione non è inclusa nei tuoi acquisti attivi." : "Hai già acquistato? Accedi con l’e-mail utilizzata durante l’acquisto."}</div>}
          {purchased ? <a className="product-primary" href="#materiali">Consulta i tuoi materiali <span aria-hidden="true">↓</span></a>
            : <Link className="product-primary" href="/accedi">Accedi alla mia biblioteca <span aria-hidden="true">↗</span></Link>}
          <p className="product-disclosure">{product.disclosure}</p>
        </div>
      </div>
      <section className="product-materials" id="materiali">
        <div className="product-section-heading"><p className="eyebrow">IL TUO SPAZIO CREATIVO</p><h2>I contenuti della collezione</h2>
        <p>I materiali effettivamente disponibili nel tuo account sono visualizzati qui sotto.</p></div>
        {purchased && files.length ? <div className="asset-grid">{files.map(file => <article className="asset-card" key={file.id}>
          <div className="asset-icon" aria-hidden="true">{file.fileType === "pdf" ? "▤" : "◉"}</div>
          <h3>{file.title}</h3>{file.description && <p>{file.description}</p>}
          <a href={`/api/library/${product.collectionId}/${file.id}`} target="_blank" rel="noopener noreferrer" className="asset-open">{file.fileType === "pdf" ? "Apri il PDF" : "Apri il contenuto"} ↗</a>
        </article>)}</div> : <div className="materials-empty">
          <div className="materials-symbol" aria-hidden="true">{purchased ? "☷" : "♧"}</div>
          <h3>{purchased ? "I materiali non sono ancora stati caricati" : "Una biblioteca dedicata alle tue creazioni"}</h3>
          <p>{purchased ? "L’accesso alla collezione è confermato, ma non risultano ancora file pubblicati. Contatta l’assistenza per ricevere i contenuti previsti dal tuo acquisto." : "Per proteggere i materiali digitali, i file sono disponibili esclusivamente ai clienti con un acquisto attivo."}</p>
          {unavailable && <p>La verifica dell’accesso è temporaneamente non disponibile. Riprova tra poco.</p>}
          {!purchased && <Link href="/accedi">Verifica il tuo acquisto →</Link>}
        </div>}
      </section>
    </main>
    <footer className="product-footer"><span>BorsaMia · Creato con cura per chi ama l’uncinetto</span><Link href="/">Torna alla biblioteca</Link></footer>
  </div>;
}
