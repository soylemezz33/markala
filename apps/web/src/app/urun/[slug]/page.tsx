import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@markala/ui";
import {
  CaretRight,
  Truck,
  CreditCard,
  PaintBrush,
  MagnifyingGlass,
  CheckCircle,
  ListChecks,
  Question,
} from "@phosphor-icons/react/dist/ssr";
import { PRODUCTION_TOLERANCE_NOTE } from "@markala/mock-data";
import {
  getCategoryBySlug,
  getProductBySlug,
  getProductsByCategory,
  getProductsBySlugs,
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
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

// ISR — admin fiyat/içerik değişiklikleri ~30sn içinde storefront'a yansısın;
// /api/revalidate webhook anlık tazeleme için ek güvence sağlar.
export const revalidate = 300;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  // BURADA notFound() ÇAĞIRMA (2026-08-31). Eski yorumun iddiası ("notFound() burada
  // çağrılınca statü 200 değil gerçek 404 döner") ÖLÇÜMLE ÇÜRÜTÜLDÜ: /urun/<olmayan>
  // konteynere doğrudan sorulduğunda HTTP 200 + not-found gövdesi dönüyordu.
  // Statüyü sayfa bileşenindeki notFound() belirler; burada yalnız noindex metadata döner.
  if (!product) return { title: "Sayfa bulunamadı", robots: { index: false, follow: false } };
  const category = await getCategoryBySlug(product.categorySlug);
  // Layout zaten "%s · Markala" template'ine sahip, "| Markala" eklemeyelim.
  // Kategori adı yoksa "X —  Baskı" (çift boşluk) yerine sade "X Baskı" fallback'i.
  // Title bütçesi: template " · Markala" +10 karakter ekler; SERP/Ahrefs ~70 sınırı için
  // seoTitle ≤60 hedeflenir. İSG levhaları gibi cümle uzunluğunda adlarda önce kategori
  // eki atılır, ad hâlâ uzunsa kelime sınırında kırpılır. H1 ve JSON-LD tam adı kullanır.
  const TITLE_MAX = 60;
  const fullTitle =
    product.seo?.title?.replace(/\s*[|·]\s*Markala\s*$/i, "") ??
    (category?.name ? `${product.name} - ${category.name} Baskı` : `${product.name} Baskı`);
  const seoTitle =
    fullTitle.length <= TITLE_MAX
      ? fullTitle
      : product.name.length <= TITLE_MAX
        ? product.name
        : `${product.name.slice(0, TITLE_MAX - 1).replace(/\s+\S*$/, "")}…`;
  const seoDesc =
    product.seo?.description ??
    `${product.name} baskı ${product.displayPrice ? `${product.displayPrice} TL'den` : ""}. ${product.shortDescription}`;
  // SERP description'ı kelime ortasından kesmesin ("...koruyucu donan" gibi) — son tam
  // kelimede bırak. OG/Twitter için de aynı kural (limitleri farklı).
  const clip = (s: string, max: number) =>
    s.length <= max ? s : s.slice(0, max).replace(/\s+\S*$/, "");
  const url = `/urun/${product.slug}`;
  // og:image = GERÇEK ürün görseli (raster JPEG) varsa onu kullan; gerçek foto yoksa
  // (images[0] bir /api/mockup SVG fallback'i ise) markalı PNG. Sosyal crawler SVG'yi reddeder.
  const ogImage =
    product.images[0] && !product.images[0].includes("/api/mockup")
      ? product.images[0]
      : "/og-default.png";
  return {
    title: seoTitle,
    description: clip(seoDesc, 160),
    keywords: product.seo?.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: seoTitle,
      description: clip(seoDesc, 200),
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: clip(seoDesc, 200),
      images: [ogImage],
    },
  };
}

const API_BASE =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://api:4000";

async function getShippingThreshold(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/api/settings/shipping`, { next: { revalidate: 300 } });
    if (!res.ok) return 1500;
    const data = (await res.json()) as { freeThreshold?: number };
    return typeof data.freeThreshold === "number" ? data.freeThreshold : 1500;
  } catch {
    return 1500;
  }
}

async function getPricingSettings(): Promise<{ kur: number; marj: number; kdv: number; minM2: number }> {
  // Canlı işletme değeriyle eşit (GET /api/settings/pricing → marj 1.2). Settings fetch düşerse
  // eskiden 1.5 ile %25 şişik başlangıç fiyatı gösteriliyordu.
  const fallback = { kur: 46, marj: 1.2, kdv: 0.2, minM2: 1 };
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
  // 2026-08-08 yenileme: her rozetin kendi renk kimliği (gradient ikon + zemin tonu) —
  // SectorShowcase ile aynı görsel dil; soluk tek-renk şerit "cansız" bulunmuştu.
  return [
    {
      icon: Truck,
      label: "Hızlı üretim",
      sub: productionTime
        ? `Üretim: ${productionTime} · ${freeThreshold}₺ üzeri kargo ücretsiz`
        : `${freeThreshold}₺ üzeri kargo ücretsiz`,
      grad: "from-sky-500 to-blue-600",
      tint: "bg-sky-50 border-sky-200",
    },
    {
      icon: PaintBrush,
      label: "Ücretsiz tasarım desteği",
      sub: "her siparişte",
      grad: "from-fuchsia-500 to-purple-600",
      tint: "bg-fuchsia-50 border-fuchsia-200",
    },
    {
      icon: CreditCard,
      label: "3 taksit imkânı",
      sub: "tüm kartlara",
      grad: "from-amber-400 to-orange-500",
      tint: "bg-amber-50 border-amber-200",
    },
    {
      icon: MagnifyingGlass,
      label: "Hızlı Tasarım Kontrolü",
      sub: "baskı öncesi uzman kontrolü, ücretsiz",
      grad: "from-rose-500 to-pink-600",
      tint: "bg-rose-50 border-rose-200",
    },
  ];
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const [category, related, ratingStats, shippingThreshold, pricingSettings, kurateBenzer, birlikte] =
    await Promise.all([
      getCategoryBySlug(product.categorySlug),
      getProductsByCategory(product.categorySlug),
      getProductRatingStats(product.slug),
      getShippingThreshold(),
      getPricingSettings(),
      getProductsBySlugs(product.relatedSlugs),
      getProductsBySlugs(product.birlikteSlugs),
    ]);

  // BENZER ÜRÜNLER — kürate edilmiş liste (content.relatedSlugs) varsa o kazanır; yoksa aynı
  // kategoriden doldurulur. Kürate liste "Çin branda ↔ Avrupa branda" gibi gerçekten muadil
  // olanları verir; kategori dolgusu rastgeledir. 2026-09-01'e kadar relatedSlugs okunuyor
  // ama HİÇ KULLANILMIYORDU — alan doluydu, sayfa yok sayıyordu.
  const kategoriDolgu = related.filter((p) => p.slug !== product.slug);
  const benzerUrunler = (kurateBenzer.length > 0 ? kurateBenzer : kategoriDolgu)
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

  // BİRLİKTE ALINANLAR — tamamlayıcılar, kategoriler arası olabilir (yangın söndürücü levhası
  // → acil çıkış + toplanma alanı). Yalnız elle kürate edilmişse gösterilir; uydurma yapılmaz.
  const birlikteUrunler = birlikte
    .filter((p) => p.slug !== product.slug && !benzerUrunler.some((b) => b.slug === p.slug))
    .slice(0, 4);

  // Tek ürünlü kategorilerde kategori adı ile ürün adı birebir aynı olabiliyor → kırılımda
  // "Kartvizit › Kartvizit" tekrarı oluşur. Aynıysa kategori kırılımını gizle.
  const showCategoryCrumb =
    category && category.name.trim().toLocaleLowerCase("tr") !== product.name.trim().toLocaleLowerCase("tr");
  const breadcrumbs = [
    { name: "Anasayfa", href: "/" },
    { name: "Ürünler", href: "/urunler" },
    ...(showCategoryCrumb ? [{ name: category!.name, href: `/kategori/${category!.slug}` }] : []),
    { name: product.name, href: `/urun/${product.slug}` },
  ];

  return (
    <>
      <ProductJsonLd product={product} category={category} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <TrackViewItem
        slug={product.slug}
        name={product.name}
        categorySlug={product.categorySlug}
        price={product.startingPrice}
      />
      <ProductViewTracker slug={product.slug} />

      {/* Breadcrumb header — ince bant: fold'da galeri+konfigüratöre alan bırak */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-2.5">
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

      <Container className="py-3 md:py-4">
        {/* Hero: 3 hücreli grid. Masaüstü → galeri (sol üst) + bilgi (sol alt) + konfigüratör
            (sağ, 2 satır). Mobil (tek kolon, DOM sırası) → galeri → KONFİGÜRATÖR → bilgi:
            müşteri fiyatı/seçenekleri hemen galeri altında görür, pazarlama metni aşağıda.
            2026-08: 7/5 → 6/6 kolon + üst padding diyeti — 24" altı (1080p laptop)
            ekranlarda görsel ekranı yutmasın, fiyat+CTA scroll'suz görünsün. */}
        {/* rows [auto_1fr] (2026-08-30): auto_auto iken sağdaki uzun konfigüratörün fazla
            yüksekliği İLK satıra da dağılıyordu → galeri ile açıklama arasında ürüne göre
            büyüyen boşluk. 1fr fazlalığı ikinci satıra verir; açıklama galerinin hemen
            altında başlar. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[auto_1fr] gap-y-8 gap-x-8 lg:gap-x-10 items-start">
          {/* 1) Galeri + hızlı aksiyon — mobilde 1. 2026-08-07: 6→5 kolon; konfigüratör
              seçenekler + sağda ayrı fiyat özet kartı (rakip deseni) için 7 kolona çıktı. */}
          <div className="lg:col-span-5 lg:col-start-1 lg:row-start-1 space-y-3">
            <Gallery
              images={product.images}
              alt={product.name}
              fallbackSrc={`/api/mockup?slug=${product.slug}&w=800&h=800`}
            />
            <div className="flex items-center gap-2">
              <WishlistButton slug={product.slug} variant="labeled" />
              <ShareButton title={product.name} />
            </div>
          </div>

          {/* 2) Konfigüratör (seçenekler + sticky fiyat özeti sağda) — MOBİLDE galerinin hemen altında (2.).
              Sticky artık konfigüratörün İÇİNDEKİ özet kartında; dış sarmalayıcı sabit akar. */}
          <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:row-span-2">
            <Configurator
              product={product}
              rating={ratingStats.count > 0 ? { average: ratingStats.average, count: ratingStats.count } : undefined}
              pricing={pricingSettings}
            />
          </div>

          {/* 3) Açıklama + özellikler/kullanım — masaüstünde galerinin altında, mobilde konfigüratörden sonra (3.) */}
          <div className="lg:col-span-5 lg:col-start-1 lg:row-start-2 space-y-8">
            {product.description && (
              <p className="text-ink-700 leading-relaxed text-[15px]">
                {product.description}
              </p>
            )}

            {((product.features && product.features.length > 0) ||
              (product.useCases && product.useCases.length > 0)) && (
              <div className="grid md:grid-cols-2 gap-8 md:gap-10">
                {product.features && product.features.length > 0 && (
                  <section>
                    <header className="flex items-center gap-2 mb-4">
                      <CheckCircle size={20} weight="fill" className="text-brand-700" />
                      <h2 className="text-lg font-semibold text-ink-900">Öne Çıkan Özellikler</h2>
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
                      <h2 className="text-lg font-semibold text-ink-900">Kullanım Alanları</h2>
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
          </div>
        </div>

        {/* Güven rozetleri — tam genişlik şerit; rozet başına renk kimliği (2026-08-08). */}
        <ul className="mt-10 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-paper-200 pt-8">
          {makeTrustBadges(shippingThreshold, product.productionTime).map((t) => (
            <li
              key={t.label}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-shadow hover:shadow-md ${t.tint}`}
            >
              <div
                className={`flex-none w-10 h-10 rounded-lg bg-gradient-to-br ${t.grad} grid place-items-center text-white shadow-sm`}
              >
                <t.icon size={19} weight="fill" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink-900 leading-snug">{t.label}</div>
                <div className="text-xs text-ink-500 mt-0.5 leading-relaxed">{t.sub}</div>
              </div>
            </li>
          ))}
        </ul>

        {/* Ürün detayları — tam genişlik sekmeli (Teknik Özellikler | Dosya Hazırlama) */}
        <div className="mt-14 lg:mt-16">
          <h2 className="text-2xl font-semibold text-ink-900 mb-4">Ürün Detayları</h2>
          <ProductTabs specifications={product.specifications ?? []} />
        </div>

        {/* SSS — tam genişlik. FAQPage şeması JSON-LD'de (ProductJsonLd graph'ı) —
            microdata BİLEREK yok, çift işaretleme Google'da tutarsızlık riski yaratır.
            Üretim toleransı (fire) notu artık her zaman son SSS maddesi → bölüm daima render
            edilir (yasal not hiçbir üründe kaybolmaz). */}
        <section className="mt-14">
          <header className="flex items-center gap-2 mb-5">
            <Question size={22} weight="fill" className="text-brand-700" />
            <h2 className="text-2xl font-semibold text-ink-900">Sık Sorulan Sorular</h2>
          </header>
          <div className="space-y-3 max-w-3xl">
            {(product.faqs ?? []).map((f, i) => (
              <details
                key={i}
                className="group bg-paper-50 border border-paper-200 rounded-lg overflow-hidden open:shadow-sm"
              >
                <summary className="cursor-pointer px-4 py-3 font-medium text-ink-900 text-sm flex items-center justify-between hover:bg-paper-100 transition-colors">
                  <span>{f.q}</span>
                  <CaretRight
                    size={14}
                    weight="bold"
                    className="transition-transform group-open:rotate-90 text-ink-500"
                  />
                </summary>
                <div className="px-4 pb-4 text-sm text-ink-700 leading-relaxed border-t border-paper-200/50 bg-paper-100/30">
                  <span>{f.a}</span>
                </div>
              </details>
            ))}

            {/* Üretim toleransı (fire) — yasal zorunluluk. Eskiden yorum bölümünün hemen
                altında amber bant olarak duruyordu; yorum-yok güvence kutusunun ("hatalı
                baskıda ücretsiz değişim") yanına düşünce güven mesajını baltalıyordu.
                Yasal metin (PRODUCTION_TOLERANCE_NOTE) aynen korunur, yalnız konumu SSS. */}
            <details className="group bg-paper-50 border border-paper-200 rounded-lg overflow-hidden open:shadow-sm">
              <summary className="cursor-pointer px-4 py-3 font-medium text-ink-900 text-sm flex items-center justify-between hover:bg-paper-100 transition-colors">
                <span>Üretim toleransı (fire) nedir?</span>
                <CaretRight
                  size={14}
                  weight="bold"
                  className="transition-transform group-open:rotate-90 text-ink-500"
                />
              </summary>
              <div className="px-4 pb-4 text-sm text-ink-700 leading-relaxed border-t border-paper-200/50 bg-paper-100/30">
                <span>
                  {PRODUCTION_TOLERANCE_NOTE} Bu sektör standardı tolerans aralığı, sipariş
                  onayında otomatik olarak kabul edilmiş sayılır. Detaylara{" "}
                  <Link
                    href="/yasal/mesafeli-satis"
                    className="underline font-medium hover:text-brand-700"
                  >
                    Mesafeli Satış Sözleşmesi Madde 7.A
                  </Link>{" "}
                  ve{" "}
                  <Link href="/yasal/iade" className="underline font-medium hover:text-brand-700">
                    İade Politikası
                  </Link>
                  &apos;ndan ulaşabilirsin.
                </span>
              </div>
            </details>
          </div>
        </section>

        {/* Müşteri yorumları — tam genişlik */}
        <div className="mt-14">
          <ProductReviewsSection productSlug={product.slug} />
        </div>

        {/* BİRLİKTE ALINANLAR — tamamlayıcı ürünler. Benzer ürünlerden ÖNCE gelir: müşteri
            alternatif aramaktan çok setini tamamlamaya yönlendirilir (sepet ortalaması). */}
        {birlikteUrunler.length > 0 && (
          <section className="mt-24 md:mt-32 pt-16 border-t border-paper-200">
            <header className="mb-10">
              <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
                Setini tamamla
              </p>
              <h2 className="mt-2 text-3xl md:text-4xl font-semibold text-ink-900">
                Bununla birlikte alınanlar
              </h2>
            </header>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {birlikteUrunler.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* BENZER ÜRÜNLER — muadiller (kürate liste varsa o, yoksa aynı kategori) */}
        {benzerUrunler.length > 0 && (
          <section
            className={`pt-16 border-t border-paper-200 ${birlikteUrunler.length > 0 ? "mt-16" : "mt-24 md:mt-32"}`}
          >
            <header className="mb-10">
              <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
                {kurateBenzer.length > 0 ? "Muadil seçenekler" : "Aynı kategoride"}
              </p>
              <h2 className="mt-2 text-3xl md:text-4xl font-semibold text-ink-900">
                {kurateBenzer.length > 0 ? "Benzer ürünler" : "Bunları da inceleyin"}
              </h2>
            </header>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {benzerUrunler.map((p) => (
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
