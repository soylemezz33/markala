import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  ArrowRight,
  Phone,
  WhatsappLogo,
  Info,
  CheckCircle,
  Truck,
  Tag,
  Lightning,
} from "@phosphor-icons/react/dist/ssr";
import { getCategories, getProducts } from "@/lib/catalog";
import { getDisplayPrice } from "@/lib/configurator";
import { formatPriceDisplay } from "@/lib/format";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const SITE = "https://markala.com.tr";

export const metadata: Metadata = {
  // absolute: kok layout'taki `template: "%s · Markala"` ekini bu sayfada bastirir,
  // aksi halde baslik "... - markala.com.tr · Markala" seklinde ciftlenirdi.
  title: { absolute: "Online Matbaa Fiyat Listesi 2026 - markala.com.tr" },
  description:
    "Güncel matbaa başlangıç fiyatları, KDV dahil. Türkiye geneli kargo. 30+ ürün için fiyat tablosu: kartvizit, broşür, afiş ve daha fazlası.",
  alternates: { canonical: "/fiyat-listesi" },
  openGraph: {
    type: "website",
    title: "Online Matbaa Fiyat Listesi 2026 - markala.com.tr",
    description: "Tüm matbaa ürünleri için güncel başlangıç fiyatları (KDV dahil).",
    url: "/fiyat-listesi",
    images: [
      { url: "/og-default.png", width: 1200, height: 630, alt: "Markala Online Matbaa Fiyat Listesi" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Matbaa Fiyat Listesi 2026 - markala.com.tr",
    description: "Tüm matbaa ürünleri için güncel başlangıç fiyatları (KDV dahil).",
    images: ["/og-default.png"],
  },
};

// Kategori başına tablo satırı tavanı. 860 ürünün tamamı tek sayfada 2.17 MB HTML
// üretiyordu — Googlebot 2 MB'tan sonrasını taramaz (Ahrefs "page size exceeds 2 MB").
// En ucuz N ürün listelenir; kalanlar "+X ürün daha" satırıyla kategori sayfasına gider.
const MAX_ROWS_PER_CATEGORY = 20;

// İSG (iş güvenliği) levhaları 10 alt kategoriye yayılıyor ve sayfanın yarısını
// kaplıyordu. Bunlar en alta, tablo yerine kompakt kart düzenine alınır.
const ISG_ROWS_PER_CATEGORY = 5;
const isIsgCategory = (slug: string) => slug.startsWith("is-guvenligi");

export default async function PriceListPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  // Kategoriye göre grupla
  const byCategory = categories
    .map((cat) => ({
      cat,
      items: products
        .filter((p) => p.categorySlug === cat.slug)
        .sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b)),
    }))
    .filter((g) => g.items.length > 0);

  const mainGroups = byCategory.filter((g) => !isIsgCategory(g.cat.slug));
  const isgGroups = byCategory.filter((g) => isIsgCategory(g.cat.slug));
  const isgCount = isgGroups.reduce((sum, g) => sum + g.items.length, 0);

  // Schema.org PriceSpecification + ItemList
  const priceSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE}/fiyat-listesi#list`,
    name: "Online Matbaa Fiyat Listesi 2026",
    description: "Markala'nın tüm matbaa ürünleri için başlangıç fiyatları.",
    numberOfItems: products.length,
    // Özet sayfa kalıbı: SADECE ListItem name+url — iç içe Product/Offer BASMA.
    // Çıplak Offer'lar (description/brand/kargo/iade alansız) GSC "Satıcı girişleri"nde
    // 50 öğelik uyarı üretiyordu (2026-07). Tam Product verisi PDP'de (ProductJsonLd).
    // price:0 (Teklif Al) filtresi korunur — liste yalnızca fiyatlı ürünleri saysın.
    itemListElement: products.filter((p) => getDisplayPrice(p) > 0).slice(0, 50).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${SITE}/urun/${p.slug}`,
    })),
  };

  // Vitrin başlangıç fiyatı — "teklif usulü" (0) ürünleri katma, yoksa
  // "0 ₺'den başlar" gibi bozuk metin çıkar.
  const allPrices = products.map((p) => getDisplayPrice(p)).filter((v) => v > 0);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Yardım", href: "/yardim" },
          { name: "Fiyat Listesi", href: "/fiyat-listesi" },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(priceSchema).replace(/</g, "\\u003c") }}
      />

      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span
              aria-hidden
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-700 text-[12px] font-bold leading-none text-paper-50"
            >
              ₺
            </span>
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              Güncel Fiyat Listesi
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Online Matbaa Fiyat Listesi 2026 - markala.com.tr
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            {minPrice > 0 ? (
              <>
                Markala'nın tüm matbaa ve reklam ürünleri için güncel başlangıç fiyatları,
                <strong className="text-ink-900"> {minPrice.toLocaleString("tr-TR")} ₺'den </strong>
                başlar, KDV dahil.
              </>
            ) : (
              <>
                Fiyatlarımız güncelleniyor. Güncel fiyat ve teklif için ürün sayfalarından veya{" "}
                <Link href="/iletisim" className="font-semibold underline hover:text-brand-700">
                  iletişim
                </Link>{" "}
                üzerinden bize ulaşabilirsiniz.
              </>
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/15 text-success rounded-full font-medium">
              <CheckCircle size={13} weight="fill" />
              KDV dahil fiyatlar
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-900 rounded-full font-medium">
              <Truck size={13} weight="fill" />
              Türkiye geneli kargo
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-200 text-ink-900 rounded-full font-medium">
              <Tag size={13} weight="fill" />
              İlk siparişe %10 indirim
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-10 md:py-14 max-w-5xl">
        {/* Özel teklif CTA — fiyat listesinin başında */}
        <section className="mb-10 p-6 md:p-8 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <Lightning size={24} weight="fill" className="text-brand-400 mx-auto mb-2" />
          <h2 className="text-xl md:text-2xl font-semibold">Özel teklif ister misin?</h2>
          <p className="mt-2 text-sm text-paper-100/70 max-w-xl mx-auto">
            Toplu siparişler, firmanıza özel fiyat ve bu listede göremediğiniz ürünler için
            WhatsApp'tan yazın ya da arayın — 5 dakikada yanıt.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://wa.me/905057417028?text=Merhaba,+matbaa+fiyat+listesinden+toplu+sipariş+için+özel+teklif+almak+istiyorum."
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#25D366] hover:bg-[#1FB358] text-white rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              <WhatsappLogo size={14} weight="fill" /> WhatsApp Teklif
            </a>
            <a
              href="tel:+903244333351"
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              <Phone size={14} weight="fill" /> 0324 433 33 51
            </a>
            <Link
              href="/kurumsal/basvuru"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Kurumsal Başvuru
            </Link>
          </div>
        </section>

        {/* Bilgilendirme */}
        <section className="mb-10 p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Info size={20} weight="fill" className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 leading-relaxed">
            <strong>Bu fiyatlar minimum sipariş adetleri için başlangıç fiyatlarıdır.</strong> Ürün
            konfigüratöründe paket (eko/lak/vip), adet, ek özellikler (UV lak, yaldız, selefon)
            seçildikçe fiyat anında güncellenir. Toplu siparişlerde indirimler mevcuttur.{" "}
            <Link href="/kurumsal" className="font-semibold underline hover:text-amber-700">
              Kurumsal hesap (B2B) firmanıza özel avantajlı fiyat
            </Link>
            .
          </div>
        </section>

        {/* TOC */}
        <nav className="mb-10 p-5 bg-paper-50 border border-paper-200 rounded-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
            Kategoriye git ({byCategory.length} kategori, {products.length} ürün)
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {mainGroups.map((g) => (
              <li key={g.cat.slug}>
                <a
                  href={`#${g.cat.slug}`}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-ink-900 hover:bg-paper-100 hover:text-brand-700"
                >
                  {g.cat.name}{" "}
                  <span className="text-ink-500 font-normal text-xs">({g.items.length})</span>
                </a>
              </li>
            ))}
            {isgGroups.length > 0 && (
              <li>
                <a
                  href="#is-guvenligi"
                  className="block px-3 py-2 rounded-md text-sm font-medium text-ink-900 hover:bg-paper-100 hover:text-brand-700"
                >
                  İş Güvenliği Levhaları{" "}
                  <span className="text-ink-500 font-normal text-xs">({isgCount})</span>
                </a>
              </li>
            )}
          </ul>
        </nav>

        {/* Tablo bölümleri */}
        <div className="space-y-10">
          {mainGroups.map((g) => (
            <section key={g.cat.slug} id={g.cat.slug} className="scroll-mt-24">
              <header className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-ink-900">{g.cat.name}</h2>
                  <p className="text-sm text-ink-500 mt-1">{g.cat.shortDescription}</p>
                </div>
                <Link
                  href={`/kategori/${g.cat.slug}`}
                  className="hidden sm:inline-flex items-center gap-1 py-2 -my-2 px-1 -mx-1 text-sm text-brand-700 hover:text-ink-900 font-medium shrink-0"
                >
                  Kategori sayfası <ArrowRight size={11} weight="bold" />
                </Link>
              </header>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-paper-200 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">
                      <th className="px-3 py-2.5">Ürün</th>
                      <th className="px-3 py-2.5">Boyut/Özellik</th>
                      <th className="px-3 py-2.5">Üretim</th>
                      <th className="px-3 py-2.5 text-right">Başlangıç (KDV dahil)</th>
                      {/* "İncele" sütunu KALDIRILDI (2026-08-31). Ürün adı hücresi zaten
                          /urun/{slug}'a link olduğu için her satırda AYNI hedefe giden iki
                          link vardı. Kaldırmanın üç kazancı: (1) denetimde bu sayfada
                          sayılan yüzlerce 47×16px dokunma hedefi tamamen yok oldu
                          (WCAG 2.2 AA ≥24×24), (2) sütun 5→4 indiği için mobilde 412px'e
                          çıkan tablo 358px'lik kapsayıcıya sığıyor — 23 tablonun 23'ünde
                          birden yatay kaydırma bitiyor, (3) aynı satırdaki çift link
                          taramada da gereksizdi. */}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper-100">
                    {g.items.slice(0, MAX_ROWS_PER_CATEGORY).map((p) => (
                      <tr key={p.slug} className="hover:bg-paper-50">
                        <td className="px-3 py-3">
                          <Link
                            href={`/urun/${p.slug}`}
                            className="font-medium text-ink-900 hover:text-brand-700"
                          >
                            {p.name}
                          </Link>
                          {p.bestseller && (
                            <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-brand-100 text-brand-900">
                              POPÜLER
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs text-ink-700">{p.sizeLabel ?? "-"}</td>
                        <td className="px-3 py-3 text-xs text-ink-500">{p.productionTime}</td>
                        <td className="px-3 py-3 text-right">
                          <span className="font-semibold text-ink-900 tabular-nums">
                            {formatPriceDisplay(getDisplayPrice(p))}
                          </span>
                          {getDisplayPrice(p) > 0 && (
                            <span className="text-xs text-ink-500 ml-1">'den</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {g.items.length > MAX_ROWS_PER_CATEGORY && (
                <Link
                  href={`/kategori/${g.cat.slug}`}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-brand-700 bg-paper-50 border border-paper-200 hover:bg-paper-100 hover:text-ink-900"
                >
                  +{g.items.length - MAX_ROWS_PER_CATEGORY} ürün daha, tüm {g.cat.name} fiyatları{" "}
                  <ArrowRight size={11} weight="bold" />
                </Link>
              )}
            </section>
          ))}
        </div>

        {/* İş güvenliği levhaları — sayfa sonunda, kompakt kart düzeni */}
        {isgGroups.length > 0 && (
          <section id="is-guvenligi" className="mt-14 scroll-mt-24">
            <header className="mb-4">
              <h2 className="text-2xl font-semibold text-ink-900">İş Güvenliği (İSG) Levhaları</h2>
              <p className="text-sm text-ink-500 mt-1">
                {isgGroups.length} alt kategori, {isgCount} ürün — uyarı, yasaklayıcı, emredici,
                yangın ve trafik levhaları. Fiyatlar en uygun ebattan başlar.
              </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {isgGroups.map((g) => (
                <div
                  key={g.cat.slug}
                  id={g.cat.slug}
                  // min-w-0: grid hücresi varsayılan olarak min-width:auto'dur; içerideki
                  // `truncate` bağlantı kısalmak yerine hücreyi şişirip TÜM SAYFAYI yana
                  // kaydırıyordu (mobilde 352px taşma, 2026-08-31).
                  className="min-w-0 scroll-mt-24 p-4 bg-paper-50 border border-paper-200 rounded-xl"
                >
                  <h3 className="text-sm font-semibold text-ink-900">
                    <Link href={`/kategori/${g.cat.slug}`} className="hover:text-brand-700">
                      {g.cat.name}
                    </Link>
                  </h3>
                  <ul className="mt-2.5 space-y-1.5">
                    {g.items.slice(0, ISG_ROWS_PER_CATEGORY).map((p) => (
                      <li
                        key={p.slug}
                        className="flex items-baseline justify-between gap-2 text-xs"
                      >
                        <Link
                          href={`/urun/${p.slug}`}
                          // min-w-0: flex öğesi de varsayılan min-width:auto; bu olmadan
                          // `truncate` hiç devreye girmez (üç nokta yerine taşma olur).
                          className="min-w-0 truncate text-ink-700 hover:text-brand-700"
                        >
                          {p.name}
                        </Link>
                        <span className="font-semibold text-ink-900 tabular-nums shrink-0">
                          {formatPriceDisplay(getDisplayPrice(p))}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/kategori/${g.cat.slug}`}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-ink-900"
                  >
                    {g.items.length > ISG_ROWS_PER_CATEGORY
                      ? `+${g.items.length - ISG_ROWS_PER_CATEGORY} ürün daha`
                      : "Tüm ürünler"}{" "}
                    <ArrowRight size={10} weight="bold" />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Fiyatlama mantığı açıklaması */}
        <section className="mt-16 p-6 md:p-8 bg-paper-50 border border-paper-200 rounded-xl">
          <h2 className="text-xl font-semibold text-ink-900 mb-4">Fiyatlamamız nasıl çalışır?</h2>
          <ul className="space-y-3 text-sm text-ink-700">
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Adet × Birim Fiyat:</strong> Sipariş adediniz
                arttıkça birim maliyet düşer. Örneğin 1.000 kartvizit ₺200 ise 5.000 kartvizit ₺650
                olabilir (₺130/1000 birim).
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Paket seçimi:</strong> Eko, Lak, VIP gibi paketler
                farklı malzeme/işlem içerir. Örneğin EKO 350 gr mat kuşe iken VIP 400 gr Bristol +
                lokal UV içerebilir.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Ek işlemler:</strong> Selefon, UV lak, yaldız,
                kabartma gibi ek işlemler %20-50 oranında fiyatı artırır. Konfigüratörde anında
                görürsünüz.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Tasarım desteği:</strong> Ücretsiz. Hazır dosyanız
                yoksa grafik ekibimiz tasarlar, fiyata dahildir.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Kargo:</strong> 1.500 ₺ üzeri sipariş Türkiye geneli
                ücretsiz. Altında 79 ₺ kargo ücreti eklenir.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Kurumsal indirim:</strong> Düzenli sipariş veren
                B2B müşterilere firmanıza özel avantajlı fiyatlandırma, açık fatura, ay sonu
                kapanış.
              </span>
            </li>
          </ul>
        </section>

        {/* Yasal not */}
        <p className="mt-8 text-xs text-ink-500 text-center max-w-2xl mx-auto">
          Bu fiyat listesi düzenli olarak güncellenmektedir. Hammadde
          maliyetlerine bağlı olarak fiyatlar değişebilir; sipariş onaylandığında fiyat sabitlenir.
          Kayıtlı kullanıcılar için fiyat geçmişi hesap panelinde görüntülenir.
        </p>
      </Container>
    </>
  );
}
