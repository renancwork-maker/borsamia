/** Testable, escaped Italian transactional copy. Never enumerate unpurchased products. */
import { productPages } from "@/lib/catalog";

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]!);

export function welcomeMessage(collectionIds: readonly string[], baseUrl: string) {
  const purchased = productPages.filter(product => collectionIds.includes(product.collectionId));
  if (!purchased.length) throw new Error("no_purchased_products");
  const base = new URL(baseUrl);
  if (base.protocol !== "https:") throw new Error("invalid_app_base_url");
  const accessUrl = new URL("/accedi", base).toString();
  const libraryUrl = new URL("/biblioteca", base).toString();
  const names = purchased.map(product => product.title);
  const subject = "Benvenuta su BorsaMia! I tuoi contenuti sono pronti";
  const text = [
    "Ciao! 🌷",
    "",
    "Grazie per il tuo acquisto su BorsaMia! Il tuo pagamento è stato confermato.",
    "",
    "I contenuti disponibili nel tuo account:",
    ...names.map(name => `• ${name}`),
    "",
    "COME ACCEDERE:",
    `1. Apri ${accessUrl}`,
    "2. Inserisci lo stesso indirizzo e-mail usato su Hotmart.",
    "3. Controlla la tua casella di posta (anche lo spam) e apri il link di accesso.",
    `4. Consulta i tuoi contenuti nella biblioteca: ${libraryUrl}`,
    "",
    "Se hai acquistato altri contenuti aggiuntivi, compariranno nella biblioteca dopo la conferma del relativo pagamento.",
    "Il Club è accessibile soltanto durante il periodo di abbonamento pagato e attivo.",
    "",
    "Buone creazioni!",
    "Il team BorsaMia",
    "",
    "Questo è un prodotto digitale: non è prevista una spedizione fisica.",
  ].join("\n");
  const items = names.map(name => `<li style="margin:0 0 8px">${escapeHtml(name)}</li>`).join("");
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#fbf7f2;font-family:Arial,sans-serif;color:#3c2d31"><main style="max-width:580px;margin:32px auto;padding:32px;background:#fff;border-radius:16px"><p style="font-size:24px;margin:0 0 8px">BorsaMia 🌷</p><h1 style="font-size:23px;line-height:1.4">Benvenuta nella tua biblioteca creativa!</h1><p>Grazie per il tuo acquisto. Il tuo pagamento è stato confermato.</p><h2 style="font-size:17px">I contenuti disponibili nel tuo account</h2><ul>${items}</ul><h2 style="font-size:17px">Come accedere</h2><ol><li>Apri la pagina di accesso.</li><li>Inserisci <strong>lo stesso indirizzo e-mail usato su Hotmart</strong>.</li><li>Controlla la tua casella di posta (anche lo spam) e apri il link ricevuto.</li><li>Consulta i contenuti nella tua biblioteca.</li></ol><p style="margin:28px 0"><a href="${escapeHtml(accessUrl)}" style="background:#80485d;color:#fff;padding:14px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Accedi alla mia biblioteca</a></p><p>Se hai acquistato altri contenuti aggiuntivi, saranno visibili dopo la conferma del relativo pagamento.</p><p>Il Club è accessibile soltanto durante il periodo di abbonamento pagato e attivo.</p><p>Buone creazioni!<br><strong>Il team BorsaMia</strong></p><p style="font-size:12px;color:#777">Questo è un prodotto digitale: non è prevista una spedizione fisica.</p></main></body></html>`;
  return { subject, text, html };
}
