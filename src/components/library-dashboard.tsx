"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { productPages } from "@/lib/catalog";

export default function LibraryDashboard() {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => productPages.filter(p => `${p.title} ${p.subtitle}`.toLocaleLowerCase("it").includes(search.toLocaleLowerCase("it"))), [search]);
  return <div className="product-layout library-layout">
    <header className="product-header"><Link href="/" className="brand-text">Borsa<span>Mia</span></Link><nav><Link href="/biblioteca">La mia biblioteca</Link><Link href="/accedi" className="header-access">Accedi</Link></nav></header>
    <main className="library-main">
      <section className="home-hero"><div><p className="eyebrow">LA TUA BIBLIOTECA CREATIVA</p><h1>Un mondo di idee, <em>un punto alla volta.</em></h1><p>Esplora le collezioni BorsaMia e ritrova i tuoi progetti all’uncinetto in uno spazio pensato con cura.</p><Link href="/accedi" className="product-primary">Accedi ai tuoi acquisti ↗</Link></div><Image src="/images/borse.webp" width={760} height={507} alt="Borsa fatta all’uncinetto, immagine illustrativa" priority /></section>
      <section className="home-catalog"><div className="home-heading"><div><p className="eyebrow">SCOPRI LE COLLEZIONI</p><h2>Le collezioni BorsaMia</h2></div>
        <label className="searchbox"><span aria-hidden="true">⌕</span><input aria-label="Cerca una collezione" placeholder="Cerca una collezione…" value={search} onChange={event => setSearch(event.target.value)}/></label>
      </div><div className="library-grid">{filtered.map(p => <article className="library-card" key={p.slug}><Link href={`/prodotti/${p.slug}`} className="library-card-cover"><Image src={p.image} width={760} height={507} alt={p.alt} sizes="(max-width: 720px) 100vw, 40vw"/><span className="access-pill">Acquisto richiesto</span></Link><div className="library-card-body"><h3>{p.title}</h3><p>{p.subtitle}</p><Link href={`/prodotti/${p.slug}`} className="library-card-link">Scopri la collezione →</Link></div></article>)}</div>
      {filtered.length === 0 && <p>Nessuna collezione trovata.</p>}</section>
      <p className="home-footnote">Le fotografie sono illustrative. Ogni collezione si attiva soltanto dopo la verifica dell’acquisto. Gli abbonamenti e i prodotti aggiuntivi sono venduti separatamente.</p>
    </main><footer className="product-footer">BorsaMia · Fatto con amore e cura</footer>
  </div>;
}
