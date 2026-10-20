"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type SessionResult = { authenticated?: boolean };
type MessageResult = { message?: string };

export default function AccessForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(true);

  const goToLibrary = () => { router.replace("/biblioteca"); router.refresh(); };
  useEffect(() => {
    let active = true;
    void fetch("/api/access/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then(async response => response.ok ? await response.json() as SessionResult : null)
      .then(data => { if (active && data?.authenticated) { router.replace("/biblioteca"); router.refresh(); } })
      .catch(() => {})
      .finally(() => { if (active) setRestoring(false); });
    return () => { active = false; };
  }, [router]);

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const cached = await fetch("/api/access/session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const existing = await cached.json() as SessionResult;
      if (cached.ok && existing.authenticated) { goToLibrary(); return; }
      const response = await fetch("/api/access/request", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const body = await response.json() as MessageResult;
      setMessage(body.message ?? "Si è verificato un problema. Riprova più tardi.");
      if (response.ok) setStep("code");
    } catch { setMessage("Connessione non disponibile. Riprova più tardi."); }
    finally { setBusy(false); }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/access/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }),
      });
      if (response.ok) { goToLibrary(); return; }
      const body = await response.json() as MessageResult;
      setMessage(body.message ?? "Codice non valido. Riprova.");
    } catch { setMessage("Connessione non disponibile. Riprova più tardi."); }
    finally { setBusy(false); }
  }

  if (restoring) return <div className="access-form" role="status">Verifica dell'accesso in corso…</div>;
  if (step === "code") return <form onSubmit={(event) => { void submitCode(event); }} className="access-form">
    <p className="code-intro">Per proteggere i tuoi acquisti, inserisci il codice di 6 cifre inviato a <strong>{email}</strong>. Solo al primo accesso su questo dispositivo o quando la sessione scade.</p>
    <label htmlFor="code">Codice di verifica</label>
    <input id="code" type="text" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" required minLength={6} maxLength={6}
      placeholder="123456" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
    <button type="submit" disabled={busy || code.length !== 6}>{busy ? "Verifica in corso…" : "Entra nella mia biblioteca"} <span aria-hidden="true">→</span></button>
    <button type="button" className="access-secondary" disabled={busy} onClick={() => { setStep("email"); setCode(""); setMessage(""); }}>Cambia e-mail o richiedi un nuovo codice</button>
    {message && <p role="status" className="form-message">{message}</p>}
  </form>;
  return <form onSubmit={(event) => { void submitEmail(event); }} className="access-form">
    <label htmlFor="email">Indirizzo e-mail</label>
    <input id="email" type="email" autoComplete="email" required maxLength={254} placeholder="nome@esempio.it" value={email} onChange={event => setEmail(event.target.value)} />
    <button type="submit" disabled={busy}>{busy ? "Verifica in corso…" : "Accedi alla mia biblioteca"} <span aria-hidden="true">→</span></button>
    <p className="login-hint">Su un dispositivo già verificato entri direttamente. Al primo accesso ricevi un codice di sicurezza via e-mail, senza link.</p>
    {message && <p role="status" className="form-message">{message}</p>}
  </form>;
}
