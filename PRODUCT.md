# BorsaMia — definizione commerciale e funzionale

Il sito e tutte le interfacce rivolte al cliente sono **esclusivamente in italiano (it-IT)**.
Questo repository contiene quattro prodotti confermati; altri prodotti non vanno attivati senza ID e materiali verificati.

| ID Hotmart | Produttto | ID interno | Pagina | Regola |
|---|---|---|---|---|
| 8765000 | Collezione di 101 Modelli di Borse all’Uncinetto | borse | /prodotti/borse | acquisto singolo |
| 8765113 | Manuale di Fodere per Borse all’Uncinetto | fodere | /prodotti/fodere | acquisto singolo |
| 8765856 | Club delle Tendenze all’Uncinetto | club | /prodotti/club | abbonamento mensile, accesso solo durante il periodo verificato |
| 8766213 | Collezione di 37 Modelli di Portachiavi all’Uncinetto | portachiavi-37 | /prodotti/portachiavi | acquisto singolo |

## Contenuti promessi

- Borse: biblioteca di 101 modelli digitali, consultabili nell’app.
- Fodere: manuale di misure, cerniere, tasche, rinforzi e tutorial visivi.
- Club: abbonamento mensile, 12 nuovi modelli al mese, tra borse, accessori, abbigliamento e progetti stagionali. Le condizioni economiche sono mostrate in checkout.
- Portachiavi: raccolta digitale di 37 schemi. **Non** 21.

Le raccolte aggiuntive e il Club sono venduti separatamente. Il servizio è solo digitale, senza consegna di articoli fisici.

## Stato del repository

L’interfaccia e il livello tecnico per notifiche Hotmart, controllo accessi e file protetti sono implementati. **Non sono inclusi i PDF, le 101 istruzioni, i 37 schemi, i tutorial, né i 12 schemi mensili reali**: caricarli nel bucket privato prima di vendere. Le foto presenti sono **illustrazioni** e non provano i contenuti reali. Credenziali e database di produzione, storage e deploy devono essere configurati esternamente.

## Sicurezza

Non basta conoscere l’e-mail di un altro acquirente. L’accesso richiede un link al titolare dell’e-mail, una sessione verificata sul server e una autorizzazione derivata da webhook autenticati. Ogni PDF è protetto anche dal backend. Le notifiche con `product.id = 0` sono sandbox e non liberano contenuti. Le notifiche prive di un periodo pagato verificabile per il Club restano in revisione invece di concedere accesso.
