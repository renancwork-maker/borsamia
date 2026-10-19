"use client";
import { useState } from "react";

export default function AdminLogout() {
  const [message, setMessage] = useState("");
  async function logout() {
    try {
      const response = await fetch("/api/admin/session", { method: "DELETE" });
      if (!response.ok) { setMessage("Sessione locale chiusa. Non è stato possibile confermare la revoca remota. Riprova più tardi."); return; }
      window.location.replace("/admin/accedi");
    } catch { setMessage("Connessione non disponibile. Riprova."); }
  }
  return <><button onClick={() => { void logout(); }}>Esci</button><p role="status">{message}</p></>;
}
