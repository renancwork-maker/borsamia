# BorsaMia – accesso senza link

La prima verifica da un dispositivo nuovo utilizza un codice di 6 cifre inviato tramite Supabase Auth, con SMTP di Resend. Le visite successive nello stesso browser riprendono la sessione (cookie HttpOnly, rinnovo limitato a 30 giorni). Non è sicuro concedere i prodotti soltanto perché qualcuno conosce l'indirizzo e-mail del cliente.

## Flusso di acquisto

Hotmart → webhook autenticato → PostgreSQL/Supabase (`current_entitlements`) → Resend API → messaggio personalizzato con le collezioni disponibili e gli eventuali prodotti aggiuntivi già confermati. Ulteriori acquisti arrivati con eventi separati possono generare una nuova notifica con le collezioni aggiornate.

## Flusso di accesso

`/accedi` → `/api/access/session` (ripristino da cookie, se valido) → `/biblioteca`. Se il dispositivo non è riconosciuto: `/api/access/request` → email OTP → `/api/access/confirm` con email e codice → cookie di accesso e rinnovo → biblioteca. La biblioteca e i download verificano sempre l'identità e i diritti di acquisto nel database.

## Configurazione richiesta

Supabase > Authentication > Email Templates: sostituire **Magic Link** e **Confirm signup** con il template HTML `TEMPLATE-EMAIL-CODICE-SUPABASE.html`, usando `{{ .Token }}` e non `{{ .ConfirmationURL }}`. Supabase Auth deve avere SMTP di Resend configurato. I messaggi transazionali di benvenuto sono invece inviati dal webhook via API Resend della Netlify.

Non eliminare il controllo su token/sessione; non fare lookup e rilascio materiali pubblici semplicemente per e-mail.
