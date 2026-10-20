/** Metadati pubblici. L'accesso è sempre verificato dal server. */
export type ProductPage = {
  slug: "borse" | "fodere" | "club" | "portachiavi";
  collectionId: string;
  hotmartId: string;
  title: string;
  eyebrow: string;
  subtitle: string;
  description: string;
  disclosure: string;
  image: string;
  alt: string;
  count: number | null;
  points: readonly string[];
};
export const productPages: readonly ProductPage[] = [
  {
    slug: "borse", collectionId: "borse", hotmartId: "8765000",
    eyebrow: "LA TUA BIBLIOTECA CREATIVA", title: "101 Modelli di Borse all’Uncinetto",
    subtitle: "La tua prossima creazione inizia da qui.",
    description: "La tua biblioteca creativa dedicata alle borse all’uncinetto: una collezione digitale di 101 modelli da esplorare per trovare l’ispirazione per il tuo prossimo progetto. L’acquisto include l’accesso all’app web BorsaMia e alla collezione principale, consultabile da smartphone, tablet e computer.",
    disclosure: "I prodotti aggiuntivi e l’abbonamento al Club delle Tendenze all’Uncinetto sono venduti separatamente. Prodotto digitale: non è prevista la spedizione di articoli fisici.",
    image: "/images/borse.webp", alt: "Borsa artigianale all’uncinetto in un ambiente accogliente, immagine illustrativa", count: 101,
    points: ["101 modelli da esplorare", "Biblioteca digitale sempre a portata di mano", "Accesso da smartphone, tablet e computer"],
  },
  {
    slug: "fodere", collectionId: "fodere", hotmartId: "8765113",
    eyebrow: "DETTAGLI CHE FANNO LA DIFFERENZA", title: "Manuale di Fodere per Borse all’Uncinetto",
    subtitle: "Il tocco finale per le tue borse.",
    description: "Completa le tue borse all’uncinetto con fodere curate, resistenti e funzionali. Un manuale digitale dedicato alla realizzazione delle fodere, con indicazioni su misure, cerniere, tasche e rinforzi, accompagnate da tutorial visivi passo dopo passo.",
    disclosure: "Il manuale viene aggiunto alla tua biblioteca BorsaMia dopo la conferma dell’acquisto. La collezione principale e gli altri contenuti aggiuntivi sono venduti separatamente. Prodotto digitale: non include materiali né articoli fisici.",
    image: "/images/fodere.webp", alt: "Interno di una borsa all’uncinetto con fodera, tasca e cerniera, immagine illustrativa", count: null,
    points: ["Misure e preparazione della fodera", "Cerniere, tasche e rinforzi", "Tutorial visivi passo dopo passo"],
  },
  {
    slug: "club", collectionId: "club", hotmartId: "8765856",
    eyebrow: "NUOVE IDEE OGNI MESE", title: "Club delle Tendenze all’Uncinetto",
    subtitle: "Nuove idee per continuare a creare durante tutto l’anno.",
    description: "Il Club delle Tendenze all’Uncinetto è un abbonamento mensile che propone 12 nuovi modelli ogni mese: borse, accessori, capi d’abbigliamento e progetti stagionali ispirati alle tendenze della moda.",
    disclosure: "I contenuti del Club sono disponibili nell’app web BorsaMia secondo le condizioni dell’abbonamento. La collezione principale e gli altri prodotti aggiuntivi sono venduti separatamente. L’abbonamento prevede un addebito ricorrente mensile. Prezzo iniziale, importo dei rinnovi e condizioni di cancellazione sono indicati nell’offerta al momento dell’acquisto. Prodotto interamente digitale.",
    image: "/images/club.webp", alt: "Selezione di borse e capi all’uncinetto dai colori naturali, immagine illustrativa", count: 12,
    points: ["12 nuovi modelli ogni mese", "Borse, accessori e abbigliamento", "Progetti stagionali e tendenze creative"],
  },
  {
    slug: "portachiavi", collectionId: "portachiavi-37", hotmartId: "8766213",
    eyebrow: "PICCOLI PROGETTI, GRANDI IDEE", title: "37 Modelli di Portachiavi all’Uncinetto",
    subtitle: "Trasforma gli avanzi di filato in piccoli progetti creativi.",
    description: "Una collezione digitale di modelli di portachiavi all’uncinetto per realizzare accessori da usare o regalare, sperimentando colori e abbinamenti personali.",
    disclosure: "La collezione viene aggiunta alla tua biblioteca BorsaMia dopo la conferma dell’acquisto. La collezione principale e gli altri contenuti aggiuntivi sono venduti separatamente. Prodotto digitale: non include filati, strumenti né portachiavi già realizzati.",
    image: "/images/portachiavi.webp", alt: "Portachiavi all’uncinetto a forma di fiori, fragola e mini borsa, immagine illustrativa", count: 37,
    points: ["37 modelli creativi", "Idee per valorizzare gli avanzi di filato", "Accessori da usare e regalare"],
  },
] as const;

export const collections = productPages.map(product => ({
  id: product.collectionId,
  title: product.title,
  subtitle: product.subtitle,
  count: product.count,
  image: product.image,
  alt: product.alt,
  slug: product.slug,
}));

export function findProduct(slug: string) { return productPages.find(p => p.slug === slug); }
export function findCollection(id: string) { return productPages.find(p => p.collectionId === id); }
