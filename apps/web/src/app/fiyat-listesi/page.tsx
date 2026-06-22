import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  CurrencyCircleDollar,
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
  title: "Matbaa Fiyat Listesi 2026 — Kartvizit, Broşür, Afiş Fiyatları",
  description:
    "Güncel matbaa fiyatları (Mayıs 2026): kartvizit 200 TL'den, broşür 380 TL'den, afiş 250 TL'den. KDV dahil, Türkiye geneli kargo. 30+ ürün için tablo.",
  keywords: [
    "matbaa fiyatları 2026",
    "kartvizit fiyatları",
    "broşür baskı fiyat",
    "afiş baskı fiyatı",
    "matbaa fiyat listesi",
    "kupa baskı fiyatı",
    "etiket baskı fiyatı",
    "magnet baskı fiyatı",
    "ucuz matbaa fiyatları",
    "online matbaa fiyatları",
    "antetli kağıt fiyatı",
    "zarf baskı fiyatı",
    "mersin matbaa fiyat",
  ],
  alternates: { canonical: "/fiyat-listesi" },
  openGraph: {
    type: "website",
    title: "Matbaa Fiyat Listesi 2026 — Markala",
    description: "Tüm matbaa ürünleri için güncel başlangıç fiyatları (KDV dahil).",
    url: "/fiyat-listesi",
    images: [
      { url: "/og-default.png", width: 1200, height: 630, alt: "Markala Matbaa Fiyat Listesi" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Matbaa Fiyat Listesi 2026 — Markala",
    description: "Tüm matbaa ürünleri için güncel başlangıç fiyatları (KDV dahil).",
    images: ["/og-default.png"],
  },
};

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

  // Schema.org PriceSpecification + ItemList
  const priceSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE}/fiyat-listesi#list`,
    name: "Matbaa Fiyat Listesi 2026",
    description: "Markala'nın tüm matbaa ürünleri için başlangıç fiyatları.",
    numberOfItems: products.length,
    itemListElement: products.slice(0, 50).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.name,
        url: `${SITE}/urun/${p.slug}`,
        offers: {
          "@type": "Offer",
          price: getDisplayPrice(p),
          priceCurrency: "TRY",
          availability: "https://schema.org/InStock",
        },
      },
    })),
  };

  // Toplam ürün, fiyat aralığı — "teklif usulü" (0) ürünleri vitrin aralığına katma,
  // yoksa "0 ₺'den başlar" gibi bozuk metin çıkar.
  const allPrices = products.map((p) => getDisplayPrice(p)).filter((v) => v > 0);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(priceSchema) }}
      />

      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <CurrencyCircleDollar size={20} weight="fill" className="text-brand-700" />
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              Güncel Fiyat Listesi
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Matbaa Fiyat Listesi 2026
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            {minPrice > 0 ? (
              <>
                Markala'nın tüm matbaa ve reklam ürünleri için güncel başlangıç fiyatları —
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
            {byCategory.map((g) => (
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
          </ul>
        </nav>

        {/* Tablo bölümleri */}
        <div className="space-y-12">
          {byCategory.map((g) => (
            <section key={g.cat.slug} id={g.cat.slug} className="scroll-mt-24">
              <header className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-ink-900">{g.cat.name}</h2>
                  <p className="text-sm text-ink-500 mt-1">{g.cat.shortDescription}</p>
                </div>
                <Link
                  href={`/kategori/${g.cat.slug}`}
                  className="hidden sm:inline-flex items-center gap-1 text-sm text-brand-700 hover:text-ink-900 font-medium shrink-0"
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
                      <th className="px-3 py-2.5 text-right">İncele</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper-100">
                    {g.items.map((p) => (
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
                        <td className="px-3 py-3 text-xs text-ink-700">{p.sizeLabel ?? "—"}</td>
                        <td className="px-3 py-3 text-xs text-ink-500">{p.productionTime}</td>
                        <td className="px-3 py-3 text-right">
                          <span className="font-semibold text-ink-900 tabular-nums">
                            {formatPriceDisplay(getDisplayPrice(p))}
                          </span>
                          {getDisplayPrice(p) > 0 && (
                            <span className="text-xs text-ink-500 ml-1">'den</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Link
                            href={`/urun/${p.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-ink-900"
                          >
                            Detay <ArrowRight size={10} weight="bold" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

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
                yoksa grafik ekibimiz tasarlar — fiyata dahildir.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Kargo:</strong> 750 ₺ üzeri sipariş Türkiye geneli
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

        {/* Final CTA */}
        <section className="mt-12 p-8 md:p-12 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <Lightning size={28} weight="fill" className="text-brand-400 mx-auto mb-3" />
          <h2 className="text-2xl md:text-3xl font-semibold">Özel teklif ister misin?</h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            Toplu siparişler ({minPrice.toLocaleString("tr-TR")} ₺ ile{" "}
            {maxPrice.toLocaleString("tr-TR")} ₺ arası fiyat aralığında) için size özel teklif —
            WhatsApp veya telefonla 5 dakikada yanıt.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://wa.me/905319004102?text=Merhaba,+matbaa+fiyat+listesinden+toplu+sipariş+için+özel+teklif+almak+istiyorum."
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

        {/* Yasal not */}
        <p className="mt-8 text-xs text-ink-500 text-center max-w-2xl mx-auto">
          Bu fiyat listesi <strong>Mayıs 2026</strong> tarihinde güncellenmiştir. Hammadde
          maliyetlerine bağlı olarak fiyatlar değişebilir; sipariş onaylandığında fiyat sabitlenir.
          Kayıtlı kullanıcılar için fiyat geçmişi hesap panelinde görüntülenir.
        </p>
      </Container>
    </>
  );
}
