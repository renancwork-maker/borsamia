"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function CustomerLogout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <button type="button" className="customer-logout" disabled={busy} onClick={() => {
    setBusy(true);
    void fetch("/api/access/logout", { method: "POST" })
      .then(response => { if (response.ok) { router.replace("/accedi"); router.refresh(); } })
      .finally(() => setBusy(false));
  }}>{busy ? "Uscita…" : "Esci"}</button>;
}
