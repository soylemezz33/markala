import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Container, Price } from "@markala/ui";
import { BookOpen, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { getProductsByCategory, getCategories, getCategoryBySlug } from "@/lib/catalog";
import { AllProductsClient } from "@/app/urunler/all-products-client";
import { CategoryJsonLd, BreadcrumbJsonLd, FAQPageJsonLd } from "@/components/seo/json-ld";
import { formatPriceDisplay } from "@/lib/format";
import type { Metadata } from "next";
import { kategoriyeGoreGrup } from "@/lib/product-groups";

interface Props {
  params: { slug: string };
  searchParams?: { page?: string | string[] };
}

/**
 * Kategori → fiyat rehberi eşlemesi. Rehber sayfaları başka hiçbir sayfadan
 * bağlantı almıyordu (yetim içerik) — Google için keşif/otorite sinyali sıfırdı.
 * İSG kategorileri (is-guvenligi-*) prefix ile tek rehbere gider.
 */
const KATEGORI_REHBERI: Record<string, { href: string; label: string }> = {
  kartvizit: { href: "/rehber/kartvizit-fiyatlari-2026", label: "Kartvizit Fiyatları 2026 Rehberi" },
  brosur: { href: "/rehber/brosur-baski-fiyatlari-2026", label: "Broşür Baskı Fiyatları 2026 Rehberi" },
  "kapi-aski-brosur": {
    href: "/rehber/brosur-baski-fiyatlari-2026",
    label: "Broşür Baskı Fiyatları 2026 Rehberi",
  },
  "vinil-branda-afis": {
    href: "/rehber/branda-baski-m2-fiyati-2026",
    label: "Branda Baskı m² Fiyatı 2026 Rehberi",
  },
  afis: { href: "/rehber/afis-baski-fiyatlari-2026", label: "Afiş Baskı Fiyatları 2026 Rehberi" },
  // Pleksi/kompozit/kanvas aynı kategoride (dekota-baski) → hepsi pleksi rehberine bağlanır.
  "dekota-baski": { href: "/rehber/pleksi-baski-fiyatlari-2026", label: "Pleksi Baskı Fiyatları 2026 Rehberi" },
  folyo: { href: "/rehber/folyo-baski-fiyatlari-2026", label: "Folyo Baskı Fiyatları 2026 Rehberi" },
  rollup: { href: "/rehber/rollup-fiyatlari-2026", label: "Rollup Fiyatları 2026 Rehberi" },
};

function rehberBul(slug: string) {
  if (slug.startsWith("is-guvenligi-")) {
    return {
      href: "/rehber/isg-zorunlu-uyari-levhalari",
      label: "İSG Uyarı Levhaları Rehberi - Renkler ve Zorunlu İşaretler",
    };
  }
  return KATEGORI_REHBERI[slug];
}

/** Tekrarlı query anahtarı (?x=a&x=b) Next'te string[] gelir — ilkini al (crash guard). */
const first = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

/** ?page ayrıştır: yalnız 2+ anlamlıdır; boş/geçersiz/1 → 1 (sayfa 1 parametresiz kanonik). */
const parsePage = (raw: string): number => {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 1 ? n : 1;
};

// ISR — admin kategori/ürün değişiklikleri storefront'a yansısın; /api/revalidate webhook
// anlık tazeleme için ek güvence sağlar.
//
// ⚠️ RENDER KARARI (SEO sayfalaması, 2026-07-20): ?page=N için searchParams okunduğundan
// Next 14 bu route'u artık İSTEK ANINDA render eder (searchParams erişimi route'u komple
// dynamic yapar — Next'te "yalnız query varken dynamic" diye route-içi ayrım yoktur; bunun
// bedeli generateStaticParams ön-üretiminin bu route için etkisizleşmesidir). Kabul edilen
// takas: 800+ üründe kategori başına yalnız ilk 12 ürünün iç link alması, tam sayfalanmış
// crawl edilebilir HTML'den daha pahalı bir SEO kaybıydı. Maliyet düşük kalır çünkü veri
// katmanı (lib/catalog fetchJson) kendi `next: { revalidate: 300 }` Data Cache'ini kullanır:
// API yükü ve TTFB ISR'a yakındır, admin değişiklikleri yine ≤300sn + webhook ile yansır.
// revalidate export'u fetch cache varsayılanı/niyet belgesi olarak bırakıldı.
export const revalidate = 300;

/**
 * GERÇEK HTTP 404 (2026-08-31). Ölçüldü: bu kurulumda (Next 14 + output:"standalone" + ISR)
 * `notFound()` not-found ARAYÜZÜNÜ gösteriyor ama yanıt statüsünü 404 YAPMIYOR — /kategori,
 * /urun, /blog, /yasal hepsi HTTP 200 dönüyordu. Buna karşılık `dynamicParams = false`
 * kullanan rotalar (/matbaa, /hizmetler, /yardim) doğru 404 veriyor: o karar router
 * seviyesinde alınıyor ve notFound()'a hiç ihtiyaç duymuyor. Korelasyon 9 rotada birebir.
 *
 * Neden burada güvenli: generateStaticParams `getCategories()` kullanıyor, o da public
 * /categories ucundan YALNIZ AKTİF kategorileri alıyor. Yani pasife alınan kategori
 * (ör. lightbox) listede olmaz ve doğrudan 404 döner — Google Ads "hedef çalışmıyor"
 * denetimi HTTP durumuna baktığı için bozuk açılış sayfası artık sessizce bütçe yakamaz.
 *
 * BEDELİ: panelden YENİ kategori eklendiğinde sayfası bir sonraki deploy'a kadar 404 verir.
 * Kategori nadiren eklenir ve zaten ürün girişi + deploy gerektirir; kabul edildi.
 * Ürün ve blog rotalarında AYNI ŞEY YAPILMADI: oralara sık içerik ekleniyor (blog her
 * sabah otomatik yazıyor), 404 penceresi kabul edilemez.
 */
export async function generateStaticParams() {
  const cats = await getCategories();
  return cats.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const cat = await getCategoryBySlug(params.slug);
  // SOFT-404 — ÇÖZÜLMEDİ, azaltıldı (2026-08-31). Ölçüm: bu kurulumda (Next 14 +
  // output:"standalone") olmayan kategori/ürün/blog URL'i HTTP 200 + not-found gövdesi
  // dönüyor. Denenen ve İŞE YARAMAYAN iki yol:
  //   1) notFound()'u generateMetadata yerine yalnız sayfa bileşeninde çağırmak → yine 200.
  //   2) dynamicParams=false → bu rotada İNERT: sayfa `searchParams` (sayfalama) okuduğu
  //      için rota tamamen dinamik; prerender-manifest'te /kategori sayfası SIFIR ve
  //      /kategori/[slug] dynamicRoutes'ta da yok. Gate edilecek statik param yok.
  //      (Çalıştığı yerler /matbaa, /hizmetler, /yardim — onlar searchParams okumuyor.)
  // Kalan azaltma: noindex. Statü 200 kalır ama Google soft-404'ü İNDEKSLEMEZ.
  // Google Ads "hedef çalışmıyor" denetimi HTTP durumuna baktığı için REKLAM TARAFI HÂLÂ
  // AÇIK — gerçek çözüm muhtemelen Next 15 (denetimde güvenlik gerekçesiyle de öneriliyor).
  if (!cat) return { title: "Sayfa bulunamadı", robots: { index: false, follow: false } };
  // SEO sayfalaması: sayfa N'de title'a " — Sayfa N" eki + self-canonical (?page=N dahil).
  const page = parsePage(first(searchParams?.page));
  const pageSuffix = page > 1 ? `, Sayfa ${page}` : "";
  // Layout zaten "%s · Markala" template'ine sahip, "| Markala" eklemeyelim
  // Fiyat eki: "115.92 TL'den" gibi ondalıklı görüntü SERP'te itici — tam TL'ye yuvarla,
  // "KDV Dahil" güveni ekle (sitede tüm fiyatlar KDV dahildir).
  const fiyatEki = cat.startingPrice
    ? ` - ${Math.round(Number(cat.startingPrice))} TL'den (KDV Dahil)`
    : "";
  // "Dekota Baskı" gibi adı zaten "Baskı" ile biten kategoride "Baskı Baskı" üretiliyordu.
  const adBaskiliMi = /bask[ıi]\s*$/i.test(cat.name);
  const seoTitle =
    (cat.seo?.title?.replace(/\s*[|·]\s*Markala\s*$/i, "") ??
      `${cat.name}${adBaskiliMi ? "" : " Baskı"}${fiyatEki}`) + pageSuffix;
  const seoDesc = cat.seo?.description ?? cat.longDescription;
  const url = page > 1 ? `/kategori/${cat.slug}?page=${page}` : `/kategori/${cat.slug}`;
  // og:image = gerçek kategori görseli (raster) varsa; mockup-SVG fallback'i ise markalı PNG.
  const ogImage =
    cat.imageUrl && !cat.imageUrl.includes("/api/mockup") ? cat.imageUrl : "/og-default.png";
  return {
    title: seoTitle,
    description: seoDesc.slice(0, 160),
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

export default async function CategoryPage({ params, searchParams }: Props) {
  // ?page=1 veya geçersiz page → parametresiz kanonik URL'e KALICI redirect (duplicate önlenir).
  // Sayfa N'in SSR dilimi AllProductsClient içinde üretilir: route dynamic render edildiğinden
  // useSearchParams SSR'da gerçek ?page değerini görür (Next 14 davranışı) → doğru 12'lik ürün
  // dilimi ve sayfalama <Link>'leri HTML'de yer alır.
  const rawPage = first(searchParams?.page);
  if (rawPage !== "" && parsePage(rawPage) === 1) {
    permanentRedirect(`/kategori/${params.slug}`);
  }

  const [cat, allCategories] = await Promise.all([
    getCategoryBySlug(params.slug),
    getCategories(),
  ]);
  if (!cat) notFound();
  // API kategori kapsamını (hiyerarşi dahil) doğru döndürür — client filtresine güvenme.
  // strict: API blip'inde throw → boş katalog render edilip cache'lenmesin. Not: route artık
  // dynamic render edildiğinden (bkz. üstteki RENDER KARARI) stale koruması sayfa değil
  // fetch Data Cache katmanındadır; cache'te son başarılı veri varken blip kullanıcıya yansımaz.
  const products = await getProductsByCategory(cat.slug, { strict: true });

  // GRUP KATMANI (2026-09-02): kategori, ait olduğu ürün grubu hub'ının altına yerleşir.
  // 41 kategori sayfasının her biri hub'a bir iç link verir ve kırıntı yolu gerçek yapıyı
  // gösterir. Kartvizit gibi hub'ı olmayan kategoride satır hiç basılmaz.
  const kategoriGrubu = kategoriyeGoreGrup(cat.slug);
  const breadcrumbs = [
    { name: "Anasayfa", href: "/" },
    { name: "Ürünler", href: "/urunler" },
    ...(kategoriGrubu
      ? [{ name: kategoriGrubu.label, href: `/kategoriler/${kategoriGrubu.slug}` }]
      : []),
    { name: cat.name, href: `/kategori/${cat.slug}` },
  ];

  return (
    <>
      <CategoryJsonLd category={cat} products={products} />
      <BreadcrumbJsonLd items={breadcrumbs} />

      {/* İnce başlık bandı (2026-08-08): eski büyük hero (dev görsel + uzun açıklama, ~%40
          ekran) ürün listesini fold altına itiyordu — kullanıcı kararıyla kaldırıldı.
          Breadcrumb + h1 + ürün sayısı tek bantta; SEO metni (longDescription) sayfa
          altına taşındı (aşağıda), h1 korunur. */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-2.5">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-sm text-ink-500"
          >
            <Link href="/" className="hover:text-ink-900 transition-colors">
              Anasayfa
            </Link>
            <CaretRight size={12} />
            <Link href="/urunler" className="hover:text-ink-900 transition-colors">
              Ürünler
            </Link>
            {/* Dar ekranda gizli ama DOM'da — bkz. /urun/[slug]'daki aynı desen. */}
            {kategoriGrubu && (
              <span className="hidden sm:flex items-center gap-1.5">
                <CaretRight size={12} />
                <Link
                  href={`/kategoriler/${kategoriGrubu.slug}`}
                  className="hover:text-ink-900 transition-colors"
                >
                  {kategoriGrubu.label}
                </Link>
              </span>
            )}
            <CaretRight size={12} />
            <span className="text-ink-900 font-medium">{cat.name}</span>
          </nav>
        </Container>
      </div>
      <Container className="pt-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900 leading-tight">
            {cat.name}
          </h1>
          <span className="text-sm text-ink-500">
            {/* SAYAÇ TEK KAYNAKTAN (2026-08-26 UX denetimi #8): önce `cat.productCount`
                kullanılıyordu — o değer API'de Prisma `_count.products` ham ilişki sayısı,
                yani PASİF ürünleri de sayıyor (uyarı-ikaz kategorisinde başlıkta 164, grid'de
                146 görünüyordu = 18 pasif ürün). Aynı sayfada zaten çekilmiş aktif liste
                kullanılınca tutarsızlık yapısal olarak imkânsızlaşır. */}
            {products.length} ürün · {cat.productionTime}
            {cat.startingPrice > 0 && (
              <> · <Price amount={cat.startingPrice} size="sm" className="text-ink-700 font-semibold" />&apos;den başlayan</>
            )}
          </span>
        </div>
      </Container>

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

      {/* SEO açıklama metni — eski hero'dan taşındı (kullanıcıya değil, aramaya hitap eder). */}
      {cat.longDescription && (
        <Container className="pb-10">
          <p className="max-w-3xl text-sm text-ink-500 leading-relaxed border-t border-paper-200 pt-6">
            {cat.longDescription}
          </p>
        </Container>
      )}

      {/*
        TİCARİ SEO BÖLÜMLERİ (2026-08-30) — ürün gridinin ALTINDA, satın almanın önüne geçmeden.
        Rakip SERP analizi: bu kelimelerde kazanan sayfalarda fiyat tablosu + karşılaştırma +
        teknik spek + SSS var; bizde tek cümlelik açıklama vardı ve ticari kelimelerde
        organik görünürlüğümüz sıfırdı. İçerik admin/DB'den (content.seoBolumler) gelir.
      */}
      {cat.seoBolumler && cat.seoBolumler.length > 0 && (
        <Container className="pb-12">
          <div className="max-w-3xl space-y-8 border-t border-paper-200 pt-8">
            {cat.seoBolumler.map((b, i) => (
              <section key={i}>
                <h2 className="text-xl md:text-2xl font-semibold text-ink-900 mb-3">{b.baslik}</h2>
                {b.paragraflar?.map((p, j) => (
                  <p key={j} className="text-sm text-ink-700 leading-relaxed mb-3">
                    {p}
                  </p>
                ))}
                {b.liste && b.liste.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1.5 text-sm text-ink-700 mb-3">
                    {b.liste.map((m, j) => (
                      <li key={j}>{m}</li>
                    ))}
                  </ul>
                )}
                {b.tablo && (
                  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <table className="w-full text-sm border-collapse min-w-[480px]">
                      <thead>
                        <tr>
                          {b.tablo.basliklar.map((h, j) => (
                            <th
                              key={j}
                              className="text-left font-semibold text-ink-900 border-b-2 border-ink-900 py-2 pr-4"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {b.tablo.satirlar.map((satir, j) => (
                          <tr key={j} className="border-b border-paper-200">
                            {satir.map((h, k) => (
                              <td key={k} className="py-2 pr-4 text-ink-700 align-top">
                                {h}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {b.tablo.not && (
                      <p className="mt-2 text-xs text-ink-500">{b.tablo.not}</p>
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>
        </Container>
      )}

      {/* Kategori SSS — görünen metin ile FAQPage şeması TEK kaynaktan (rehberlerdeki desen). */}
      {cat.faqs && cat.faqs.length > 0 && (
        <Container className="pb-14">
          <div className="max-w-3xl border-t border-paper-200 pt-8">
            <FAQPageJsonLd questions={cat.faqs} url={`/kategori/${cat.slug}`} />
            <h2 className="text-xl md:text-2xl font-semibold text-ink-900 mb-5">
              Sık Sorulan Sorular
            </h2>
            <div className="space-y-3">
              {cat.faqs.map((f, i) => (
                <details
                  key={i}
                  className="group bg-paper-50 border border-paper-200 rounded-lg overflow-hidden open:shadow-sm"
                >
                  <summary className="cursor-pointer px-4 py-3 font-medium text-ink-900 text-sm flex items-center justify-between hover:bg-paper-100 transition-colors">
                    <span>{f.q}</span>
                    <CaretRight
                      size={14}
                      weight="bold"
                      className="transition-transform group-open:rotate-90 text-ink-500 shrink-0 ml-3"
                    />
                  </summary>
                  <div className="px-4 pb-4 pt-3 text-sm text-ink-700 leading-relaxed border-t border-paper-200/50 bg-paper-100/30">
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </Container>
      )}

      {/* İlgili fiyat rehberi — rehberlere tek iç bağlantı kaynağı (yetim sayfa düzeltmesi). */}
      {(() => {
        const rehber = rehberBul(cat.slug);
        if (!rehber) return null;
        return (
          <Container className="pb-10">
            <Link
              href={rehber.href}
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-900 transition-colors"
            >
              <BookOpen size={16} weight="fill" />
              <span>{rehber.label}</span>
              <CaretRight size={14} weight="bold" />
            </Link>
          </Container>
        );
      })()}

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
