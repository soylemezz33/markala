import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@markala/ui";
import {
  CaretRight,
  Truck,
  ShieldCheck,
  CreditCard,
  PaintBrush,
  MagnifyingGlass,
  Info,
  CheckCircle,
  ListChecks,
  Question,
} from "@phosphor-icons/react/dist/ssr";
import { PRODUCTION_TOLERANCE_NOTE } from "@markala/mock-data";
import {
  getCategoryBySlug,
  getProductBySlug,
  getProductsByCategory,
  getProducts,
} from "@/lib/catalog";
import { getProductRatingStats } from "@/lib/reviews";
import { Configurator } from "@/components/product/configurator";
import { Gallery } from "@/components/product/gallery";
import { ProductCard } from "@/components/product-card";
import { ProductTabs } from "@/components/product/product-tabs";
import { ProductReviewsSection } from "@/components/product/reviews-section";
import { WishlistButton } from "@/components/product/wishlist-button";
import { ShareButton } from "@/components/product/share-button";
import { TrackRecentlyViewed, RecentlyViewedRail } from "@/components/product/recently-viewed";
import { TrackViewItem } from "@/components/product/track-view-item";
import { ProductViewTracker } from "@/components/product-view-tracker";
import { ProductJsonLd, BreadcrumbJsonLd, HowToProductJsonLd } from "@/components/seo/json-ld";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

// ISR — admin fiyat/içerik değişiklikleri ~30sn içinde storefront'a yansısın;
// /api/revalidate webhook anlık tazeleme için ek güvence sağlar.
export const revalidate = 30;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  // Ürün yok/silinmiş → noindex (not-found sayfası 200 dönse de Google indekslemesin; soft-404 zararını kes).
  if (!product) return { robots: { index: false, follow: false } };
  const category = await getCategoryBySlug(product.categorySlug);
  const seoTitle = product.seo?.title ?? `${product.name} — ${category?.name ?? ""} Baskı`;
  const seoDesc =
    product.seo?.description ??
    `${product.name} baskı ${product.startingPrice ? `${product.startingPrice} TL'den` : ""}. ${product.shortDescription}`;
  const url = `/urun/${product.slug}`;
  // og:image = GERÇEK ürün görseli (raster JPEG) varsa onu kullan; gerçek foto yoksa
  // (images[0] bir /api/mockup SVG fallback'i ise) markalı PNG. Sosyal crawler SVG'yi reddeder.
  const ogImage =
    product.images[0] && !product.images[0].includes("/api/mockup")
      ? product.images[0]
      : "/og-default.png";
  return {
    title: seoTitle,
    description: seoDesc.slice(0, 160),
    keywords: product.seo?.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: seoTitle,
      description: seoDesc.slice(0, 200),
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDesc.slice(0, 200),
      images: [ogImage],
    },
  };
}

const API_BASE =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://api:4000";

async function getShippingThreshold(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/api/settings/shipping`, { next: { revalidate: 300 } });
    if (!res.ok) return 750;
    const data = (await res.json()) as { freeThreshold?: number };
    return typeof data.freeThreshold === "number" ? data.freeThreshold : 750;
  } catch {
    return 750;
  }
}

async function getPricingSettings(): Promise<{ kur: number; marj: number; kdv: number; minM2: number }> {
  const fallback = { kur: 46, marj: 1.5, kdv: 0.2, minM2: 1 };
  try {
    const res = await fetch(`${API_BASE}/api/settings/pricing`, { next: { revalidate: 300 } });
    if (!res.ok) return fallback;
    const d = (await res.json()) as Partial<typeof fallback>;
    return {
      kur: typeof d.kur === "number" ? d.kur : fallback.kur,
      marj: typeof d.marj === "number" ? d.marj : fallback.marj,
      kdv: typeof d.kdv === "number" ? d.kdv : fallback.kdv,
      minM2: typeof d.minM2 === "number" ? d.minM2 : fallback.minM2,
    };
  } catch {
    return fallback;
  }
}

function makeTrustBadges(freeThreshold: number, productionTime?: string) {
  return [
    {
      icon: Truck,
      label: "Toplam teslimat süresi",
      sub: productionTime
        ? `Üretim: ${productionTime} + kargo 1-3 iş günü · ${freeThreshold}₺ üzeri ücretsiz`
        : `1-3 iş günü kargo · ${freeThreshold}₺ üzeri ücretsiz`,
    },
    { icon: PaintBrush, label: "Ücretsiz tasarım desteği", sub: "her siparişte" },
    { icon: ShieldCheck, label: "Kalite garantisi", sub: "hatalı baskıda ücretsiz değişim" },
    { icon: CreditCard, label: "3 taksit imkânı", sub: "tüm kartlara" },
    { icon: MagnifyingGlass, label: "Ücretsiz Hızlı Tasarım Kontrolü", sub: "baskı öncesi uzman ekibimiz kontrol eder" },
  ];
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const [category, related, ratingStats, shippingThreshold, pricingSettings] = await Promise.all([
    getCategoryBySlug(product.categorySlug),
    getProductsByCategory(product.categorySlug),
    getProductRatingStats(product.slug),
    getShippingThreshold(),
    getPricingSettings(),
  ]);
  const relatedProducts = related.filter((p) => p.slug !== product.slug).slice(0, 4);

  const breadcrumbs = [
    { name: "Anasayfa", href: "/" },
    { name: "Ürünler", href: "/urunler" },
    ...(category ? [{ name: category.name, href: `/kategori/${category.slug}` }] : []),
    { name: product.name, href: `/urun/${product.slug}` },
  ];

  return (
    <>
      <ProductJsonLd product={product} category={category} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <HowToProductJsonLd product={product} slug={product.slug} />
      <TrackViewItem
        slug={product.slug}
        name={product.name}
        categorySlug={product.categorySlug}
        price={product.startingPrice}
      />
      <ProductViewTracker slug={product.slug} />

      {/* Breadcrumb header */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-ink-500">
            <Link href="/" className="hover:text-ink-900 transition-colors">
              Anasayfa
            </Link>
            <CaretRight size={12} />
            <Link href="/urunler" className="hover:text-ink-900 transition-colors">
              Ürünler
            </Link>
            {category && (
              <>
                <CaretRight size={12} />
                <Link
                  href={`/kategori/${category.slug}`}
                  className="hover:text-ink-900 transition-colors"
                >
                  {category.name}
                </Link>
              </>
            )}
            <CaretRight size={12} />
            <span className="text-ink-900 font-medium">{product.name}</span>
          </nav>
        </Container>
      </div>

      <Container className="py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Sol: Galeri + Tabs */}
          <div className="lg:col-span-7 space-y-10">
            <Gallery
              images={product.images}
              alt={product.name}
              fallbackSrc={`/api/mockup?slug=${product.slug}&w=800&h=800`}
            />

            {/* Hızlı aksiyonlar — Beğen / Paylaş */}
            <div className="flex items-center gap-2">
              <WishlistButton slug={product.slug} variant="labeled" />
              <ShareButton title={product.name} />
            </div>

            {/* Tabs */}
            <ProductTabs description={product.description} />

            {/* Öne Çıkan Özellikler + Kullanım Alanları — masaüstünde yan yana (aşağıda seyrek
                durmasın, daha derli toplu). Biri yoksa diğeri tam genişlik akar. */}
            {((product.features && product.features.length > 0) ||
              (product.useCases && product.useCases.length > 0)) && (
              <div className="grid md:grid-cols-2 gap-8 md:gap-10 border-t border-paper-200 pt-8">
                {product.features && product.features.length > 0 && (
                  <section>
                    <header className="flex items-center gap-2 mb-4">
                      <CheckCircle size={20} weight="fill" className="text-brand-700" />
                      <h2 className="text-xl font-semibold text-ink-900">Öne Çıkan Özellikler</h2>
                    </header>
                    <ul className="space-y-2.5">
                      {product.features.map((f: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-ink-700 leading-relaxed"
                        >
                          <CheckCircle
                            size={16}
                            weight="fill"
                            className="text-brand-500 mt-0.5 flex-none"
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {product.useCases && product.useCases.length > 0 && (
                  <section>
                    <header className="flex items-center gap-2 mb-4">
                      <ListChecks size={20} weight="fill" className="text-brand-700" />
                      <h2 className="text-xl font-semibold text-ink-900">Kullanım Alanları</h2>
                    </header>
                    <div className="flex flex-wrap gap-2">
                      {product.useCases.map((u, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 bg-paper-100 border border-paper-200 rounded-full text-xs text-ink-700"
                        >
                          {u}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Specifications */}
            {product.specifications && product.specifications.length > 0 && (
              <section className="border-t border-paper-200 pt-8">
                <h2 className="text-xl font-semibold text-ink-900 mb-4">Teknik Özellikler</h2>
                <div className="overflow-hidden border border-paper-200 rounded-lg bg-paper-50">
                  <table className="w-full text-sm">
                    <tbody>
                      {product.specifications.map((s, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-paper-50" : "bg-paper-100/50"}>
                          <th
                            scope="row"
                            className="text-left px-4 py-2.5 font-medium text-ink-900 align-top w-2/5"
                          >
                            {s.label}
                          </th>
                          <td className="px-4 py-2.5 text-ink-700">{s.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* FAQs */}
            {product.faqs && product.faqs.length > 0 && (
              <section
                className="border-t border-paper-200 pt-8"
                itemScope
                itemType="https://schema.org/FAQPage"
              >
                <header className="flex items-center gap-2 mb-4">
                  <Question size={20} weight="fill" className="text-brand-700" />
                  <h2 className="text-xl font-semibold text-ink-900">Sık Sorulan Sorular</h2>
                </header>
                <div className="space-y-3">
                  {product.faqs.map((f, i) => (
                    <details
                      key={i}
                      className="group bg-paper-50 border border-paper-200 rounded-lg overflow-hidden open:shadow-sm"
                      itemScope
                      itemProp="mainEntity"
                      itemType="https://schema.org/Question"
                    >
                      <summary className="cursor-pointer px-4 py-3 font-medium text-ink-900 text-sm flex items-center justify-between hover:bg-paper-100 transition-colors">
                        <span itemProp="name">{f.q}</span>
                        <CaretRight
                          size={14}
                          weight="bold"
                          className="transition-transform group-open:rotate-90 text-ink-500"
                        />
                      </summary>
                      <div
                        className="px-4 pb-4 text-sm text-ink-700 leading-relaxed border-t border-paper-200/50 bg-paper-100/30"
                        itemScope
                        itemProp="acceptedAnswer"
                        itemType="https://schema.org/Answer"
                      >
                        <span itemProp="text">{f.a}</span>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Müşteri yorumları */}
            <ProductReviewsSection productSlug={product.slug} />

            {/* Üretim toleransı (fire) bandı — yasal zorunluluk */}
            <section className="border-t border-paper-200 pt-8">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                <Info size={22} weight="fill" className="text-amber-600 flex-none mt-0.5" />
                <div className="text-sm text-amber-900 leading-relaxed">
                  <strong>Üretim Toleransı:</strong> {PRODUCTION_TOLERANCE_NOTE} Bu sektör standardı
                  tolerans aralığı, sipariş onayında otomatik olarak kabul edilmiş sayılır. Detay
                  için{" "}
                  <Link
                    href="/yasal/mesafeli-satis"
                    className="underline font-medium hover:text-amber-700"
                  >
                    Mesafeli Satış Sözleşmesi Madde 7.A
                  </Link>{" "}
                  ve{" "}
                  <Link href="/yasal/iade" className="underline font-medium hover:text-amber-700">
                    İade Politikası
                  </Link>
                  'na bakınız.
                </div>
              </div>
            </section>
          </div>

          {/* Sağ: Sticky configurator */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <Configurator
                product={product}
                rating={ratingStats.count > 0 ? { average: ratingStats.average, count: ratingStats.count } : undefined}
                pricing={pricingSettings}
              />

              {/* Trust badges */}
              <ul className="mt-6 grid grid-cols-2 gap-3">
                {makeTrustBadges(shippingThreshold, product.productionTime).map((t) => (
                  <li
                    key={t.label}
                    className="flex items-start gap-3 p-4 bg-paper-100 border border-paper-200 rounded-lg"
                  >
                    <div className="flex-none w-9 h-9 rounded-md bg-paper-50 grid place-items-center text-brand-700">
                      <t.icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-ink-900">{t.label}</div>
                      <div className="text-[11px] text-ink-500 mt-0.5">{t.sub}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-24 md:mt-32 pt-16 border-t border-paper-200">
            <header className="mb-10">
              <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
                Aynı kategoride
              </p>
              <h2 className="mt-2 text-3xl md:text-4xl font-semibold text-ink-900">
                Bunları da inceleyin
              </h2>
            </header>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {relatedProducts.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}
      </Container>

      {/* Recently viewed — current ürünü dışlar */}
      <RecentlyViewedRail currentSlug={product.slug} />

      {/* Bu ürünü recent listesine ekler */}
      <TrackRecentlyViewed slug={product.slug} />
    </>
  );
}
