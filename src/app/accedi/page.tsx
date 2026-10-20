import Link from "next/link";
import AccessForm from "@/components/access-form";
export default function LoginPage() {
  return <main className="login-page"><Link href="/" className="brand login-logo"><span className="brand-icon">✿</span><span>Borsa<span className="brand-accent">Mia</span></span></Link>
    <div className="login-panel"><div className="login-art" aria-hidden="true"><p>Il tuo spazio creativo</p></div>
      <div className="login-content"><p className="eyebrow">BENTORNATA</p><h1>Accedi a BorsaMia</h1><p>Inserisci l’indirizzo e-mail utilizzato durante l’acquisto per accedere alle tue collezioni.</p><AccessForm />
      <p className="login-help">Le tue collezioni saranno disponibili solo dopo la conferma dell’acquisto.</p></div></div>
    <Link href="/" className="back-link">← Torna alla biblioteca</Link>
  </main>;
}
