"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmAccess() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function confirm() {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token_hash") ?? "";
    window.history.replaceState(null, "", window.location.pathname);
    if (!token) { setMessage("Link non valido. Richiedi un nuovo link."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/access/confirm", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
      });
      if (response.ok) { router.replace("/biblioteca"); router.refresh(); return; }
      setMessage("Link scaduto o accesso non disponibile. Richiedi un nuovo link.");
    } catch { setMessage("Connessione non disponibile. Riprova più tardi."); }
    finally { setBusy(false); }
  }
  return <div className="confirm-panel">
    <p>Conferma per accedere alle collezioni acquistate.</p>
    <button type="button" disabled={busy} className="product-primary" onClick={() => { void confirm(); }}>
      {busy ? "Verifica in corso…" : "Accedi alla mia biblioteca"}
    </button>
    {message && <p role="status">{message}</p>}
  </div>;
}
