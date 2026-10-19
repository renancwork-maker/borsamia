"use client";
import { useState, type FormEvent } from "react";
export default function AccessForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/access/request", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const body: unknown = await response.json();
      if (body && typeof body === "object" && "message" in body && typeof body.message === "string") setMessage(body.message);
      else setMessage("Si è verificato un problema. Riprova più tardi.");
    } catch { setMessage("Connessione non disponibile. Riprova più tardi."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={(event) => { void submit(event); }} className="access-form">
    <label htmlFor="email">Indirizzo e-mail</label>
    <input id="email" type="email" autoComplete="email" required maxLength={254} placeholder="nome@esempio.it" value={email} onChange={(event) => setEmail(event.target.value)} />
    <button type="submit" disabled={busy}>{busy ? "Verifica in corso…" : "Accedi alla mia biblioteca"} <span aria-hidden="true">→</span></button>
    {message && <p role="status" className="form-message">{message}</p>}
  </form>;
}
