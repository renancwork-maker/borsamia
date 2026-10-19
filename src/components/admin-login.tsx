"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";

export default function AdminLogin({ url, publishableKey }: { url?: string; publishableKey?: string }) {
  const [client] = useState(() => url && publishableKey ? createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }) : null);
  const [factor, setFactor] = useState("");
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      if (!factor) {
        const login = await client.auth.signInWithPassword({
          email: String(form.get("email")).trim(), password: String(form.get("password")),
        });
        if (login.error) throw new Error(login.error.status === 429 ? "Troppi tentativi. Riprova più tardi." : "Accesso non riuscito. Verifica le credenziali.");
        const factors = await client.auth.mfa.listFactors();
        if (factors.error) throw new Error("Verifica non disponibile.");
        const existing = factors.data.totp.find(item => item.status === "verified");
        if (existing) { setFactor(existing.id); return; }
        // Remove only unfinished TOTP enrollments from this authenticated account.
        for (const item of factors.data.all.filter(item => item.factor_type === "totp" && item.status === "unverified")) {
          const removed = await client.auth.mfa.unenroll({ factorId: item.id });
          if (removed.error) throw new Error("Configurazione non disponibile. Riprova più tardi.");
        }
        const enrolled = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: "BorsaMia Admin" });
        if (enrolled.error) throw new Error("Impossibile configurare il secondo fattore.");
        setFactor(enrolled.data.id);
        setSecret(enrolled.data.totp.secret);
      } else {
        const verified = await client.auth.mfa.challengeAndVerify({ factorId: factor, code: String(form.get("code")) });
        if (verified.error) throw new Error(verified.error.status === 429 ? "Troppi tentativi. Riprova più tardi." : "Codice non valido o scaduto.");
        const result = await fetch("/api/admin/session", {
          method: "POST", headers: { Authorization: `Bearer ${verified.data.access_token}` },
        });
        if (!result.ok) throw new Error(result.status === 403 ? "Accesso amministrativo non autorizzato." : "Servizio non disponibile. Riprova più tardi.");
        setSecret("");
        window.location.replace("/admin");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Accesso non disponibile."); }
    finally { setBusy(false); }
  }

  return <form onSubmit={event => { void submit(event); }} className="access-form">
    {!factor ? <>
      <label htmlFor="admin-email">E-mail</label>
      <input id="admin-email" name="email" type="email" autoComplete="username" required />
      <label htmlFor="admin-password">Password</label>
      <input id="admin-password" name="password" type="password" autoComplete="current-password" required />
    </> : <>
      {secret && <div><p>Aggiungi un account alla tua app di autenticazione, scegli una chiave di configurazione e inserisci questa chiave. Seleziona il tipo basato sul tempo. Non condividerla.</p><code style={{ overflowWrap: "anywhere" }}>{secret}</code></div>}
      <label htmlFor="admin-code">Codice dell’app di autenticazione</label>
      <input id="admin-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required />
    </>}
    <button type="submit" disabled={busy || !client}>{busy ? "Verifica in corso…" : factor ? "Verifica e accedi" : "Continua"}</button>
    {!client && <p role="status">Accesso temporaneamente non disponibile. La configurazione del servizio deve essere completata.</p>}
    <p role="status" aria-live="polite">{message}</p>
  </form>;
}
