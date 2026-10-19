"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { collections } from "@/lib/catalog";

const links = [
  ["▦", "La Mia Biblioteca"], ["▧", "Le Mie Collezioni"],
  ["◷", "Progetti in Corso"], ["♡", "Preferiti"],
  ["✓", "Completati"], ["◌", "Il Mio Profilo"],
] as const;

export default function LibraryDashboard() {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("La Mia Biblioteca");
  const [menuOpen, setMenuOpen] = useState(false);
  const filtered = useMemo(() => collections.filter(c => `${c.title} ${c.subtitle}`.toLocaleLowerCase("it").includes(search.toLocaleLowerCase("it"))), [search]);
  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
      <div className="brand"><span className="brand-icon">✿</span><span>Borsa<span className="brand-accent">Mia</span><small>LA TUA BIBLIOTECA CREATIVA</small></span></div>
      <p className="nav-heading">IL TUO SPAZIO</p>
      <nav aria-label="Navigazione principale">{links.map(([icon,label]) => <button type="button" key={label} className={`nav-link ${active === label ? "active" : ""}`} onClick={() => {setActive(label);setMenuOpen(false);}}><span aria-hidden="true">{icon}</span>{label}</button>)}</nav>
      <div className="sidebar-bottom"><span aria-hidden="true">♡</span><div><strong>Ogni punto racconta una storia</strong><small>Un'idea alla volta, crea qualcosa di unico.</small></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button type="button" className="menu-toggle" aria-label="Apri il menu" onClick={() => setMenuOpen(!menuOpen)}>☰</button><span className="crumb">Il mio spazio <span aria-hidden="true">/</span> {active}</span><Link href="/accedi" className="login-button">Accedi <span aria-hidden="true">↗</span></Link></header>
      <div className="dashboard-body"><div className="welcome"><div><p className="eyebrow">IL TUO ANGOLO CREATIVO</p><h1>{active === "La Mia Biblioteca" ? "La tua creatività,\nin un posto speciale." : active}</h1><p className="welcome-sub">Tutti i tuoi modelli preferiti, organizzati con cura. Lasciati ispirare e dai vita alla tua prossima creazione.</p></div><div className="welcome-illustration" aria-hidden="true"><span className="hero-sparkle">✳</span><span className="hero-bag">👜</span><span className="hero-yarn">🧶</span></div></div>
      {active === "La Mia Biblioteca" || active === "Le Mie Collezioni" ? <>
        <div className="section-heading"><div><p className="eyebrow">ESPLORA E CREA</p><h2>Le tue collezioni <span className="section-count">06</span></h2><p>Scopri tutte le collezioni disponibili su BorsaMia.</p></div><label className="searchbox"><span aria-hidden="true">⌕</span><input aria-label="Cerca una collezione" placeholder="Cerca una collezione…" value={search} onChange={e => setSearch(e.target.value)} /></label></div>
        <div className="collection-grid">{filtered.map((c,i)=><article key={c.id} className="collection-card"><div className={`card-art art-${c.theme}`}><span className="card-decoration card-decoration-one"/><span className="card-decoration card-decoration-two"/><span className="card-symbol" aria-hidden="true">{c.symbol}</span><span className="card-lock" aria-label="Collezione bloccata">🔒</span></div><div className="card-content"><span className="card-overline">COLLEZIONE {String(i+1).padStart(2,"0")}</span><h3>{c.title}</h3><p>{c.subtitle}</p><div className="card-footer"><span>{c.count !== null ? `${c.count} modelli` : "Manuale pratico"}</span><Link href="/accedi" className="card-action" aria-label={`Accedi per scoprire ${c.title}`}>↗</Link></div></div></article>)}</div>
        {filtered.length === 0 && <div className="empty-state">Nessuna collezione trovata. Prova un'altra ricerca.</div>}
        <p className="locked-note">🔒 Questa collezione non è inclusa nel tuo acquisto, oppure non hai ancora effettuato l'accesso. Accedi per verificare le tue collezioni.</p>
      </> : <div className="empty-state large-empty"><span>✿</span><h2>Questo spazio è tutto tuo</h2><p>Accedi con l'indirizzo e-mail dell'acquisto per visualizzare i tuoi contenuti e i tuoi progressi.</p><Link href="/accedi" className="primary-link">Accedi alla mia biblioteca →</Link></div>}
      <footer className="footer">BorsaMia · Fatto per chi ama creare <span>✿</span></footer></div>
    </main>
  </div>;
}
