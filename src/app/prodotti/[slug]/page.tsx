import Link from "next/link";
import { notFound } from "next/navigation";
import { productPages } from "@/lib/catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return productPages.map(({ slug }) => ({ slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productPages.find(item => item.slug === slug);
  if (!product) notFound();

  return <main className="login-page">
    <Link href="/" className="brand login-logo">BorsaMia</Link>
    <section className="login-content" aria-labelledby="product-title">
      <p className="eyebrow">LA TUA BIBLIOTECA CREATIVA</p>
      <h1 id="product-title">{product.title}</h1>
      <p>{product.description}</p>
      <p>I contenuti sono riservati a chi ha acquistato questo prodotto.</p>
      <p role="status">L’attivazione automatica degli acquisti e l’accesso ai contenuti non sono ancora disponibili.</p>
      <Link className="login-button" href="/accedi">Vai alla pagina di accesso</Link>
    </section>
    <Link className="back-link" href="/">Torna alla biblioteca</Link>
  </main>;
}
