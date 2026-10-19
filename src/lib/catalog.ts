/** Public catalogue metadata only. Purchase entitlement always comes from the backend. */
export type Collection = {
  id: string;
  title: string;
  subtitle: string;
  count: number | null;
  theme: string;
  symbol: string;
};

export const collections: readonly Collection[] = [
  { id: "borse", title: "Borse all'uncinetto", subtitle: "La collezione principale", count: 101, theme: "peach", symbol: "👜" },
  { id: "portachiavi-37", title: "Portachiavi creativi", subtitle: "37 piccoli progetti", count: 37, theme: "lavender", symbol: "🧶" },
  { id: "portachiavi-21", title: "Portachiavi con avanzi di filo", subtitle: "21 idee da realizzare", count: 21, theme: "butter", symbol: "🎀" },
  { id: "macrame", title: "Borse in macramè", subtitle: "Trame e intrecci da scoprire", count: 47, theme: "mint", symbol: "🪢" },
  { id: "bambini", title: "Neonati e bambini", subtitle: "Modelli da 0 a 5 anni", count: 101, theme: "rose", symbol: "🧸" },
  { id: "fodere", title: "Fodere e finiture", subtitle: "Manuale pratico per borse", count: null, theme: "sand", symbol: "🪡" },
] as const;
