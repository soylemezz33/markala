import Image from "next/image";
import Link from "next/link";
import { Container, Button } from "@markala/ui";
import { Images, ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { getPortfolioItems } from "@/lib/portfolio";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolyo — Tamamlanmış İşlerimiz",
  description:
    "Markala ile basılan kartvizit, broşür, branda, tabela ve promosyon işlerinden örnekler. Baskı kalitemizi ve çözümlerimizi işlerimizde görün.",
  alternates: { canonical: "/portfolio" },
  openGraph: {
    type: "website",
    title: "Portfolyo — Markala",
    description: "Markala ile basılan kartvizit, broşür, branda ve tabela işlerinden örnekler.",
    url: "/portfolio",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala Portfolyo" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-default.png"] },
};

export default async function PortfolioPage() {
  const items = await getPortfolioItems();

  return (
    <Container className="py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="text-sm text-brand-700 font-medium uppercase tracking-wider">Portfolyo</p>
        <h1 className="mt-2 text-display-lg font-serif text-ink-900">Tamamlanmış işlerimiz</h1>
        <p className="mt-4 text-lg text-ink-700 leading-relaxed">
          {/* Boş durumda "gerçek işlerde görün" vaadi çelişki yaratıyordu — metni içeriğe uydur. */}
          {items.length > 0
            ? "Kartvizitten brandaya, tabeladan promosyon ürünlerine — Markala ile hayata geçen baskı işlerinden bir seçki. Kalitemizi ekranda değil, gerçek işlerde görün."
            : "Kartvizitten brandaya, tabeladan promosyon ürünlerine — tamamladığımız işleri müşteri izinleriyle burada yayınlıyoruz."}
        </p>
      </header>

      {items.length === 0 ? (
        <section className="mt-16 max-w-2xl mx-auto text-center p-10 md:p-14 bg-paper-50 border border-paper-200 rounded-xl">
          <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-brand-100 text-brand-700 mb-5">
            <Images size={28} weight="regular" />
          </div>
          <h2 className="text-2xl font-serif text-ink-900">Yakında burada</h2>
          <p className="mt-3 text-ink-700 leading-relaxed">
            Tamamladığımız işlerden örnekleri, müşteri izinlerini aldıkça burada paylaşacağız.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/urunler">
              <Button>
                Ürünleri Keşfet <ArrowRight size={16} weight="bold" />
              </Button>
            </Link>
            <Link href="/teklif-al">
              <Button variant="outline">Teklif Al</Button>
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <article
              key={item.slug}
              className="group flex flex-col bg-paper-50 border border-paper-200 rounded-xl overflow-hidden hover:border-ink-300 hover:shadow-lg transition-all"
            >
              <div className="relative aspect-[4/3] bg-paper-100 overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {item.category && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-ink-900/80 text-paper-50 text-xs font-medium backdrop-blur">
                    {item.category}
                  </span>
                )}
              </div>
              <div className="flex flex-col flex-1 p-5">
                <h2 className="text-lg font-semibold text-ink-900">{item.title}</h2>
                {item.client && <p className="mt-0.5 text-sm text-ink-500">{item.client}</p>}
                {item.description && (
                  <p className="mt-2 text-sm text-ink-700 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                )}
                {item.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-paper-100 border border-paper-200 text-xs text-ink-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {item.productSlug && (
                  <Link
                    href={`/urun/${item.productSlug}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:gap-2.5 transition-all"
                  >
                    Bu ürünü sipariş et <ArrowUpRight size={14} weight="bold" />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {items.length > 0 && (
        <div className="mt-14 text-center">
          <p className="text-ink-700">Siz de işinizi Markala ile bastırın.</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link href="/teklif-al">
              <Button>
                Teklif Al <ArrowRight size={16} weight="bold" />
              </Button>
            </Link>
            <Link href="/urunler">
              <Button variant="outline">Ürünleri Keşfet</Button>
            </Link>
          </div>
        </div>
      )}
    </Container>
  );
}
