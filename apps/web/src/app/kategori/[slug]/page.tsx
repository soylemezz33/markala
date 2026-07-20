import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Price } from "@markala/ui";
import { CaretRight, Truck, ShieldCheck, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { getProductsByCategory, getCategories, getCategoryBySlug } from "@/lib/catalog";
import { AllProductsClient } from "@/app/urunler/all-products-client";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { CategoryJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { formatPriceDisplay } from "@/lib/format";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

// ISR — admin kategori/ürün değişiklikleri ~30sn içinde storefront'a yansısın;
// /api/revalidate webhook anlık tazeleme için ek güvence sağlar.
export const revalidate = 300;

export async function generateStaticParams() {
  const cats = await getCategories();
  return cats.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await getCategoryBySlug(params.slug);
  // Kategori yok → gerçek HTTP 404 (soft-404 yerine); notFound() metadata aşamasında statüyü 404 yapar.
  if (!cat) notFound();
  // Layout zaten "%s · Markala" template'ine sahip, "| Markala" eklemeyelim
  const seoTitle =
    cat.seo?.title?.replace(/\s*[|·]\s*Markala\s*$/i, "") ??
    `${cat.name} Baskı${cat.startingPrice ? ` — ${cat.startingPrice} TL'den` : ""}`;
  const seoDesc = cat.seo?.description ?? cat.longDescription;
  const url = `/kategori/${cat.slug}`;
  // og:image = gerçek kategori görseli (raster) varsa; mockup-SVG fallback'i ise markalı PNG.
  const ogImage =
    cat.imageUrl && !cat.imageUrl.includes("/api/mockup") ? cat.imageUrl : "/og-default.png";
  return {
    title: seoTitle,
    description: seoDesc.slice(0, 160),
    keywords: cat.seo?.keywords ?? [
      `${cat.name} baskı`,
      `${cat.name} fiyat`,
      "online matbaa",
      "markala",
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: seoTitle,
      description: seoDesc.slice(0, 200),
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: cat.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDesc.slice(0, 200),
      images: [ogImage],
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const [cat, allCategories] = await Promise.all([
    getCategoryBySlug(params.slug),
    getCategories(),
  ]);
  if (!cat) notFound();
  // API kategori kapsamını (hiyerarşi dahil) doğru döndürür — client filtresine güvenme.
  // strict: API blip'inde throw → ISR stale sayfayı korur, boş kategori 5 dk cache'lenmez.
  const products = await getProductsByCategory(cat.slug, { strict: true });

  const breadcrumbs = [
    { name: "Anasayfa", href: "/" },
    { name: "Ürünler", href: "/urunler" },
    { name: cat.name, href: `/kategori/${cat.slug}` },
  ];

  return (
    <>
      <CategoryJsonLd category={cat} products={products} />
      <BreadcrumbJsonLd items={breadcrumbs} />

      <section className="relative bg-paper-100 border-b border-paper-200 overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <Image
            src={cat.imageUrl}
            alt={cat.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-paper-100 via-paper-100/90 to-paper-100/40" />
        </div>
        <Container className="relative py-12 md:py-20">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-sm text-ink-500 mb-6"
          >
            <Link href="/" className="hover:text-ink-900 transition-colors">
              Anasayfa
            </Link>
            <CaretRight size={12} />
            <Link href="/urunler" className="hover:text-ink-900 transition-colors">
              Ürünler
            </Link>
            <CaretRight size={12} />
            <span className="text-ink-900 font-medium">{cat.name}</span>
          </nav>

          <ScrollReveal className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-900 text-xs font-semibold uppercase tracking-wider">
              <Sparkle size={12} weight="fill" /> {cat.productCount} farklı ürün
            </span>
            <h1 className="mt-4 text-4xl md:text-6xl font-semibold text-ink-900 leading-[1.05]">
              {cat.name}
            </h1>
            <p className="mt-4 text-lg md:text-xl text-ink-700 leading-relaxed max-w-2xl">
              {cat.longDescription}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <Truck size={14} className="text-brand-700" /> {cat.productionTime}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-brand-700" /> Kalite garantili
              </span>
              <span className="inline-flex items-center gap-2">
                {cat.startingPrice > 0 ? (
                  <>
                    Başlangıç:{" "}
                    <Price
                      amount={cat.startingPrice}
                      size="sm"
                      className="text-ink-900 font-semibold"
                    />
                  </>
                ) : (
                  <span className="text-ink-900 font-semibold">Teklif Al</span>
                )}
              </span>
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {products.length === 0 ? (
        <Container className="py-12 md:py-16">
          <div className="py-20 text-center bg-paper-100 rounded-xl border border-paper-200">
            <p className="text-ink-700 font-medium text-lg">{cat.name} için ürünler hazırlanıyor</p>
            <p className="mt-2 text-sm text-ink-500 max-w-md mx-auto">
              Bu kategoride şu an aktif ürün yok. İhtiyacınızı bize iletin, size özel teklif
              hazırlayalım.
            </p>
            <Link
              href="/iletisim"
              className="mt-5 inline-block text-sm font-semibold text-brand-700 hover:text-brand-900"
            >
              İletişim formuna git →
            </Link>
          </div>
        </Container>
      ) : (
        /* /urunler ile aynı çalışan toolbar/sort/fiyat/arama/sayfalama — ürünler zaten kategoriye
           kapsamlı (API), hero ve kategori filtresi gizli. */
        <AllProductsClient
          products={products}
          categories={allCategories}
          hideHero
          hideCategoryFilter
        />
      )}

      {/* İlgili kategoriler */}
      <section className="bg-paper-100 border-t border-paper-200 py-12 md:py-16">
        <Container>
          <div className="flex items-end justify-between gap-4 mb-6">
            <h2 className="text-2xl font-semibold text-ink-900">Diğer Kategoriler</h2>
            <Link
              href="/kategoriler"
              className="text-sm text-brand-700 hover:text-brand-900 font-medium"
            >
              Tümü →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {allCategories
              .filter((c) => c.slug !== cat.slug)
              .slice(0, 6)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/kategori/${c.slug}`}
                  className="group flex flex-col items-center text-center p-4 bg-paper-50 rounded-xl border border-paper-200 hover:border-ink-300 hover:shadow-sm transition-all"
                >
                  <div className="relative w-16 h-16 rounded-lg bg-paper-100 overflow-hidden mb-3">
                    <Image
                      src={c.imageUrl}
                      alt={c.name}
                      fill
                      sizes="64px"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <span className="text-sm font-medium text-ink-900 group-hover:text-brand-700 transition-colors">
                    {c.name}
                  </span>
                  <span className="mt-0.5 text-[11px] text-ink-500">
                    {c.startingPrice > 0
                      ? `${formatPriceDisplay(c.startingPrice)}'den`
                      : "Teklif Al"}
                  </span>
                </Link>
              ))}
          </div>
        </Container>
      </section>
    </>
  );
}
