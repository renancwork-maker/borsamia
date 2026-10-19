import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BorsaMia — La tua biblioteca creativa",
  description: "Uno spazio tutto tuo per esplorare e organizzare i tuoi progetti creativi all'uncinetto.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it-IT"><body suppressHydrationWarning>{children}</body></html>;
}
