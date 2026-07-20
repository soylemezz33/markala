import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  FrameCorners,
  CheckCircle,
  Info,
  ArrowRight,
  Truck,
  Lightning,
  Ruler,
} from "@phosphor-icons/react/dist/ssr";
import { getProductsByCategory, getProducts } from "@/lib/catalog";
import { getDisplayPrice } from "@/lib/configurator";
import { formatPriceWithSymbol, formatPriceDisplay } from "@/lib/format";
import { BreadcrumbJsonLd, ArticleJsonLd } from "@/components/seo/json-ld";
import { GuideFaqSection, asOfLabel } from "../_shared";

// Fiyatlar canlı katalogdan SSR — saatte bir tazelenir.
export const revalidate = 3600;

const PAGE_PATH = "/rehber/branda-baski-m2-fiyati-2026";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Branda Baskı m² Fiyatı 2026 — 2×1 m Branda Ne Kadar? (KDV Dahil)",
    description:
      "2026 güncel branda afiş m² fiyatları: vinil ve mesh branda için m² hesabının mantığı, 2×1 / 3×2 m örnek hesap tablosu, kenar detayı ve montaj SSS'i. KDV dahil fiyatlar.",
    alternates: { canonical: PAGE_PATH },
    openGraph: {
      type: "article",
      title: "Branda Baskı m² Fiyatı 2026 — Örnek Hesap Tablosu (KDV Dahil)",
      description:
        "Branda afişte m² fiyatı nasıl hesaplanır? Gerçek m² başlangıç fiyatları ve örnek ebat hesapları.",
      url: PAGE_PATH,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Branda Baskı m² Fiyatı 2026" }],
    },
  };
}

/** Örnek ebatlar (cm) — yaygın kullanım senaryoları. Fiyat DAİMA canlı m² fiyatından hesaplanır. */
const EXAMPLE_SIZES = [
  { en: 100, boy: 100, use: "Kapı/stand önü küçük afiş" },
  { en: 200, boy: 100, use: "Dükkan vitrini, kampanya pankartı" },
  { en: 300, boy: 100, use: "Cephe şeridi, açılış pankartı" },
  { en: 300, boy: 200, use: "Mağaza cephesi, etkinlik fonu" },
  { en: 500, boy: 300, use: "Bina cephesi, iskele giydirme" },
];

export default async function BrandaM2FiyatiPage() {
  // Branda kategorisi strict: API blip'inde throw → ISR stale sayfayı korur.
  const brandaList = await getProductsByCategory("vinil-branda-afis", { strict: true });
  const withPrice = brandaList.filter((p) => getDisplayPrice(p) > 0);
  if (withPrice.length === 0) {
    throw new Error("rehber/branda: branda kategorisi fiyatsız/boş döndü (API blip?) — stale ISR korunur");
  }
  const sorted = [...withPrice].sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));
  const main = sorted[0]!; // en ekonomik m² fiyatlı branda (tipik: vinil branda)
  const perM2Raw = main.displayPrice ?? 0; // ham m² başlangıç fiyatı (KDV dahil)
  const perM2 = getDisplayPrice(main); // müşteriye gösterilen (üste yuvarlanmış) hali

  // m² ile fiyatlanan diğer ürünler — canlı katalogdan; boşsa bölüm gizlenir (ana veri branda'dan).
  const allProducts = await getProducts();
  const areaProducts = allProducts
    .filter(
      (p) =>
        p.pricingMode === "area" &&
        getDisplayPrice(p) > 0 &&
        // Branda ürünleri yukarıdaki "Branda çeşitleri" bölümünde — burada tekrarlanmaz.
        p.categorySlug !== "vinil-branda-afis",
    )
    .sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));

  const asOf = asOfLabel();

  // Örnek hesap: alan (min 1 m²) × canlı m² başlangıç fiyatı — motor perM2 mantığıyla aynı,
  // elle fiyat yazılmaz. Kesin fiyat üründe malzeme/kenar seçimine göre konfigüratörde oluşur.
  const examples = EXAMPLE_SIZES.map((s) => {
    const alan = (s.en * s.boy) / 10000;
    const billedAlan = Math.max(1, alan);
    return { ...s, alan, tahmini: Math.ceil(billedAlan * perM2Raw) };
  });
  const twoByOne = examples.find((e) => e.en === 200 && e.boy === 100);

  const faqs = [
    {
      q: "Branda m² fiyatı nasıl hesaplanır?",
      a: `Branda serbest ölçüyle üretilir: en × boy ölçünden alan (m²) bulunur, seçtiğin malzemenin m² birim fiyatıyla çarpılır. ${asOf} itibarıyla en ekonomik malzemede m² fiyatı ${formatPriceWithSymbol(perM2)} (KDV dahil). Daha kalın veya özel malzemelerde m² birim fiyatı yükselir; kesin rakam ürün sayfasında ölçünü girince anında görünür.`,
    },
    {
      q: "2×1 metre branda ne kadar?",
      a: twoByOne
        ? `2×1 m = 2 m². ${asOf} itibarıyla en ekonomik malzemeyle yaklaşık ${formatPriceWithSymbol(twoByOne.tahmini)} (KDV dahil). Malzeme ve kenar detayı seçimine göre fiyat değişir; kesin fiyat için ürün sayfasında ölçüyü gir.`
        : `Alan (m²) × m² birim fiyatı formülüyle hesaplanır; güncel örnekler yukarıdaki tabloda.`,
    },
    {
      q: "1 m²'den küçük branda sipariş edebilir miyim?",
      a: "Evet, ancak fiyatlama minimum 1 m² üzerinden yapılır — 0,5 m²'lik bir iş de 1 m² fiyatıyla hesaplanır. Küçük ebatlarda üretim ve kenar işçiliği sabit maliyet oluşturduğu için bu taban uygulanır.",
    },
    {
      q: "Kenar detayı ve halka (kuşgözü) nasıl oluyor?",
      a: "Vinil brandada kenarlar katlamalı, halkalı veya germe + halka kombinasyonuyla hazırlanır; halkalar düzenli aralıklarla yerleştirilir. Branda montaja hazır teslim edilir — halkalardan bağlayarak kolayca asabilirsin. Kenar tercihi sipariş sırasında konfigüratörde seçilir.",
    },
    {
      q: "Mesh branda ne zaman tercih edilir?",
      a: "Mesh, gözenekli dokuya sahip brandadır: rüzgarın bir kısmını içinden geçirdiği için bina cephesi, iskele ve yüksek konumlarda rüzgar yükünü azaltır. Standart vinil brandaya göre m² fiyatı farklıdır; ikisini de kategoriden karşılaştırabilirsin.",
    },
    {
      q: "Fiyatlara KDV dahil mi?",
      a: "Evet, bu sayfadaki ve ürün sayfasındaki tüm m² fiyatları KDV dahildir; sepette değişmez. m² fiyatı karşılaştırırken diğer tekliflerin KDV dahil olup olmadığını mutlaka kontrol et.",
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Branda Baskı m² Fiyatı 2026", href: PAGE_PATH },
        ]}
      />
      <ArticleJsonLd
        title="Branda Baskı m² Fiyatı 2026 — Örnek Hesap Tablosu (KDV Dahil)"
        description="Branda afişte m² fiyatının hesaplanma mantığı, gerçek m² başlangıç fiyatları ve örnek ebat hesapları."
        url={PAGE_PATH}
        datePublished="2026-07-20"
      />

      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <FrameCorners size={20} weight="fill" className="text-brand-700" />
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              Fiyat Rehberi
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Branda baskı m² fiyatı 2026: nasıl hesaplanır?
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Branda serbest ölçüyle üretilir ve m² üzerinden fiyatlanır: {asOf} itibarıyla en
            ekonomik malzemede <strong className="text-ink-900">{formatPriceWithSymbol(perM2)}/m²</strong>
            &apos;den başlar — KDV dahil, sepette değişmez.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/15 text-success rounded-full font-medium">
              <CheckCircle size={13} weight="fill" /> KDV dahil — sepette değişmez
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-900 rounded-full font-medium">
              <Ruler size={13} weight="fill" /> cm bazında serbest ölçü
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-200 text-ink-900 rounded-full font-medium">
              <Truck size={13} weight="fill" /> Türkiye geneli kargo
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-10 md:py-14 max-w-4xl">
        {/* m² mantığı */}
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">m² fiyatı mantığı: 3 adımda</h2>
          <ol className="mt-5 space-y-3 text-sm text-ink-700">
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Alanı bul:</strong> en × boy (metre cinsinden).
                Örneğin 3×2 m branda = 6 m². Hesaplama minimum 1 m² üzerinden yapılır.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Malzemeyi seç:</strong> standart vinil, kalın
                gramaj, arkası siyah (blockout), ışıklı (backlit) veya mesh gibi seçeneklerin m²
                birim fiyatı farklıdır. Tablodaki başlangıç fiyatı en ekonomik malzemeye aittir.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Alan × m² birim fiyatı = toplam:</strong> kenar
                detayı (halka, katlama, germe) sipariş sırasında seçilir; kesin fiyat ürün
                sayfasındaki konfigüratörde ölçünü girdiğinde anında görünür.
              </span>
            </li>
          </ol>
        </section>

        {/* Örnek hesap tablosu */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">
            Örnek hesap tablosu ({asOf} itibarıyla katalog fiyatları)
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            {main.name} — en ekonomik malzemeyle yaklaşık toplam, KDV dahil.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5">Ebat (en × boy)</th>
                  <th className="px-3 py-2.5 text-right">Alan</th>
                  <th className="px-3 py-2.5">Tipik kullanım</th>
                  <th className="px-3 py-2.5 text-right">Yaklaşık fiyat (KDV dahil)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-100">
                {examples.map((e) => (
                  <tr key={`${e.en}x${e.boy}`} className="hover:bg-paper-50">
                    <td className="px-3 py-3 font-medium text-ink-900">
                      {e.en / 100} × {e.boy / 100} m
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-ink-700">
                      {e.alan.toLocaleString("tr-TR")} m²
                    </td>
                    <td className="px-3 py-3 text-xs text-ink-500">{e.use}</td>
                    <td className="px-3 py-3 text-right">
                      <span className="font-semibold text-ink-900 tabular-nums">
                        {formatPriceWithSymbol(e.tahmini)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Tablo canlı katalogdaki m² başlangıç fiyatından otomatik hesaplanır; malzeme ve kenar
            detayı seçimine göre kesin fiyat ürün sayfasında oluşur.
          </p>
        </section>

        {/* Dürüst karşılaştırma notu */}
        <section className="mt-10 p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Info size={20} weight="fill" className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 leading-relaxed">
            <strong>m² fiyatı karşılaştırırken:</strong> piyasada m² fiyatları çoğu zaman KDV hariç
            ve en ince malzeme üzerinden ilan edilir; kenar detayı da ayrıca ücretlendirilebilir.
            Buradaki fiyatlar KDV dahildir — karşılaştırmayı aynı malzeme ve sepet toplamı üzerinden
            yapmak en sağlıklısıdır.
          </div>
        </section>

        {/* Branda ürünleri */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">Branda çeşitleri</h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {sorted.map((p) => (
              <article key={p.slug} className="p-5 bg-paper-50 border border-paper-200 rounded-xl">
                <h3 className="font-semibold text-ink-900">{p.name}</h3>
                {p.shortDescription && (
                  <p className="mt-1.5 text-sm text-ink-700 leading-relaxed">{p.shortDescription}</p>
                )}
                <p className="mt-3 text-sm">
                  <span className="font-semibold text-ink-900 tabular-nums">
                    {formatPriceWithSymbol(getDisplayPrice(p))}/m²
                  </span>
                  <span className="text-xs text-ink-500 ml-1">&apos;den</span>
                </p>
                <Link
                  href={`/urun/${p.slug}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-ink-900"
                >
                  Ölçünü gir, fiyatı gör <ArrowRight size={11} weight="bold" />
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-700">
            Tüm branda ürünleri{" "}
            <Link
              href="/kategori/vinil-branda-afis"
              className="font-semibold text-brand-700 underline hover:text-ink-900"
            >
              vinil branda afiş kategorisinde
            </Link>
            .
          </p>
        </section>

        {/* Diğer m² ürünleri */}
        {areaProducts.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-semibold text-ink-900">m² ile fiyatlanan diğer ürünler</h2>
            <p className="mt-2 text-ink-700 text-sm">
              Aynı m² mantığı şu ürünlerde de geçerli — ölçünü gir, fiyatı anında gör:
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-paper-200 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">
                    <th className="px-3 py-2.5">Ürün</th>
                    <th className="px-3 py-2.5 text-right">m² başlangıç (KDV dahil)</th>
                    <th className="px-3 py-2.5 text-right">İncele</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-100">
                  {areaProducts.map((p) => (
                    <tr key={p.slug} className="hover:bg-paper-50">
                      <td className="px-3 py-3">
                        <Link href={`/urun/${p.slug}`} className="font-medium text-ink-900 hover:text-brand-700">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="font-semibold text-ink-900 tabular-nums">
                          {formatPriceDisplay(getDisplayPrice(p))}
                        </span>
                        {getDisplayPrice(p) > 0 && <span className="text-xs text-ink-500 ml-1">&apos;den</span>}
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
        )}

        {/* SSS + FAQPage JSON-LD */}
        <GuideFaqSection items={faqs} url={PAGE_PATH} />

        {/* CTA */}
        <section className="mt-14 p-8 md:p-12 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <Lightning size={28} weight="fill" className="text-brand-400 mx-auto mb-3" />
          <h2 className="text-2xl md:text-3xl font-semibold">Ölçünü gir, branda fiyatını gör</h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            En × boy ölçünü santimetre bazında gir; malzeme ve kenar detayını seç — toplam fiyat
            anında hesaplanır, KDV dahil.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/urun/${main.slug}`}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              Branda Fiyatını Hesapla <ArrowRight size={14} weight="bold" />
            </Link>
            <Link
              href="/kategori/vinil-branda-afis"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Branda Kategorisi
            </Link>
            <Link
              href="/teklif-al"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Büyük Ebat İçin Teklif Al
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
