import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  FlagBanner,
  CheckCircle,
  Info,
  ArrowRight,
  Truck,
  Lightning,
  PaintBrush,
} from "@phosphor-icons/react/dist/ssr";
import type { PricingOption } from "@markala/types";
import { getProductBySlug } from "@/lib/catalog";
import { calculateTotal } from "@/lib/configurator";
import { formatPriceWithSymbol } from "@/lib/format";
import { BreadcrumbJsonLd, ArticleJsonLd } from "@/components/seo/json-ld";
import { GuideFaqSection, asOfLabel, HizliCevap } from "../_shared";

// Fiyatlar canlı katalogdan SSR — saatte bir tazelenir.
export const revalidate = 3600;

const PAGE_PATH = "/rehber/rollup-fiyatlari-2026";
const PRODUCT_SLUG = "rollup-standart";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Roll-Up Fiyatları 2026 — 85x200 Banner Ne Kadar? (KDV Dahil)",
    description:
      "2026 güncel roll-up banner fiyatları: 85x200 cm standart ölçü, mekanizma + baskı ve adet kırılımıyla tablo. Tüm fiyatlar KDV dahil — sepette değişmez.",
    alternates: { canonical: PAGE_PATH },
    openGraph: {
      type: "article",
      title: "Roll-Up Fiyatları 2026 — İçerik × Adet Tablosu (KDV Dahil)",
      description:
        "85x200 roll-up banner fiyatları mekanizma/baskı ve adet kırılımıyla. KDV dahil, canlı katalogdan.",
      url: PAGE_PATH,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Roll-Up Fiyatları 2026" }],
    },
  };
}

export default async function RollupFiyatlariPage() {
  // Tek ürünlü kategori: fiyat ızgarası ürün detayından. API blip'inde throw → stale ISR korunur.
  const product = await getProductBySlug(PRODUCT_SLUG);
  if (!product || (product.prices?.length ?? 0) === 0) {
    throw new Error("rehber/rollup: ürün/fiyat çekilemedi (API blip?) — stale ISR korunur");
  }

  const opts = (product.options ?? []) as PricingOption[];
  const adetOpts = opts
    .filter((o) => o.groupKey === "adet" && o.groupRole === "dimension")
    .sort((a, b) => a.optionSort - b.optionSort);
  // Fiyatlandıran grup (içindekiler: sadece mekanizma / mekanizma + baskı) dinamik bulunur —
  // katalogda grup adı değişirse sayfa kırılmasın.
  const pricedKey = opts
    .filter((o) => o.groupRole === "priced")
    .sort((a, b) => a.groupSort - b.groupSort)[0]?.groupKey;
  const contentOpts = pricedKey
    ? opts.filter((o) => o.groupKey === pricedKey).sort((a, b) => a.optionSort - b.optionSort)
    : [];
  if (adetOpts.length === 0 || contentOpts.length === 0 || !pricedKey) {
    throw new Error("rehber/rollup: beklenen opsiyon grupları yok — stale ISR korunur");
  }

  const ebatKey = opts.find((o) => o.groupKey === "ebat")?.optionKey;
  const rows = contentOpts
    .map((c) => ({
      key: c.optionKey,
      label: c.optionLabel,
      totals: adetOpts.map((t) =>
        calculateTotal(product, {
          [pricedKey]: c.optionKey,
          adet: t.optionKey,
          ...(ebatKey ? { ebat: ebatKey } : {}),
        }),
      ),
    }))
    .filter((r) => r.totals.some((v) => v > 0));
  if (rows.length === 0) {
    throw new Error("rehber/rollup: fiyat tablosu boş hesaplandı (API blip?) — stale ISR korunur");
  }

  const asOf = asOfLabel();
  const fullRow = rows.find((r) => r.key.includes("baski")) ?? rows[rows.length - 1]!;
  const singleFull = fullRow.totals[0] ?? 0;
  const minStart = Math.min(...rows.map((r) => r.totals[0]!).filter((v) => v > 0));

  const faqs = [
    {
      q: "Baskılı roll-up (tek adet) ne kadar?",
      a:
        singleFull > 0
          ? `${asOf} itibarıyla katalog fiyatına göre mekanizma + baskı dahil 1 adet 85x200 cm roll-up ${formatPriceWithSymbol(singleFull)} — KDV dahil, sepette değişmez. Adet arttıkça birim fiyat tabloda görülür.`
          : `${asOf} itibarıyla roll-up ${formatPriceWithSymbol(minStart)}'den başlıyor; güncel kırılım yukarıdaki tabloda, KDV dahildir.`,
    },
    {
      q: "Roll-up standart ölçüsü nedir?",
      a: `${product.sizeLabel || "85 x 200 cm"} sektör standardıdır: fuar standı, mağaza girişi ve etkinlik alanı için tasarlanmış, tek kişinin dakikalar içinde kurabileceği ölçüdür. Farklı ölçü ihtiyacında teklif formundan özel fiyat alabilirsin.`,
    },
    {
      q: '"Sadece mekanizma" ile "mekanizma + baskı" farkı ne?',
      a: "Sadece mekanizma, elinde hazır basılmış branda/film varsa kasayı yenilemek içindir. Mekanizma + baskı ise tasarımının baskısı dahil, kullanıma hazır komple üründür — ilk kez alacaksan bunu seçmelisin.",
    },
    {
      q: "Fiyatlara KDV dahil mi?",
      a: "Evet, tablodaki ve ürün sayfasındaki tüm fiyatlar KDV dahildir. Piyasada roll-up fiyatları çoğunlukla KDV hariç listelenir — karşılaştırırken sepet toplamına bak.",
    },
    {
      q: "Roll-up kaç günde teslim edilir?",
      a: `Üretim süresi ${product.productionTime || "2-3 iş günü"}; kargo Türkiye geneli 1-3 iş günü sürer. Fuar/etkinlik tarihin belliyse siparişi birkaç gün önceden vermeni öneririz.`,
    },
    {
      q: "Tasarımım yok, ne yapmalıyım?",
      a: "Her siparişte tasarım desteği ücretsiz: logonu ve içeriğini gönder, baskıya hazır tasarımı ekibimiz hazırlayıp onayına sunar. Onaysız hiçbir dosya baskıya girmez.",
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Roll-Up Fiyatları 2026", href: PAGE_PATH },
        ]}
      />
      <ArticleJsonLd
        title="Roll-Up Fiyatları 2026 — İçerik × Adet Tablosu (KDV Dahil)"
        description="85x200 cm roll-up banner fiyatları: mekanizma + baskı seçenekleri ve adet kırılımıyla güncel tablo."
        url={PAGE_PATH}
        datePublished="2026-08-01"
      />

      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <FlagBanner size={20} weight="fill" className="text-brand-700" />
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              Fiyat Rehberi
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Roll-up fiyatları 2026: 85x200 banner ne kadar?
          </h1>
          <HizliCevap
            soru="Rollup banner fiyatı ne kadar?"
            cevap="Rollup fiyatı stant kalitesi (ekonomik/premium) ve ebada göre değişir; tabloda güncel seçenekler listelenir. Fiyata baskı, stant ve taşıma çantası dahildir; tutarlar KDV dahil olup üretim 2-3 iş günüdür."
          />
          <p className="mt-4 text-lg text-ink-700">
            Baskı dahil komple roll-up{" "}
            <strong className="text-ink-900">{formatPriceWithSymbol(singleFull > 0 ? singleFull : minStart)}</strong>
            &apos;den başlıyor — KDV dahil, sepette değişmez. Tablo {asOf} itibarıyla canlı katalog
            fiyatlarıdır; içerik ve adet kırılımıyla.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/15 text-success rounded-full font-medium">
              <CheckCircle size={13} weight="fill" /> KDV dahil — sepette değişmez
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-900 rounded-full font-medium">
              <PaintBrush size={13} weight="fill" /> Ücretsiz tasarım desteği
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-200 text-ink-900 rounded-full font-medium">
              <Truck size={13} weight="fill" /> Türkiye geneli kargo
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-10 md:py-14 max-w-4xl">
        {/* Dürüst karşılaştırma notu */}
        <section className="mb-10 p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Info size={20} weight="fill" className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 leading-relaxed">
            <strong>Karşılaştırırken içeriğe dikkat:</strong> Piyasadaki düşük roll-up fiyatlarının
            bir kısmı yalnız mekanizma (kasasız/baskısız) fiyatıdır. Kullanıma hazır ürün için
            &quot;mekanizma + baskı&quot; satırını kıyasla; buradaki tüm fiyatlar KDV dahildir.
          </div>
        </section>

        {/* İçerik × adet tablosu */}
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">
            {product.name} — içerik × adet fiyat tablosu ({asOf})
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            {product.sizeLabel ? `${product.sizeLabel} · ` : ""}Fiyatlar seçilen içerik ve adede göre
            toplam tutardır, KDV dahildir.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5">İçerik</th>
                  {adetOpts.map((t) => (
                    <th key={t.optionKey} className="px-3 py-2.5 text-right">
                      {t.optionLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-100">
                {rows.map((r) => (
                  <tr key={r.key} className="hover:bg-paper-50">
                    <td className="px-3 py-3 font-medium text-ink-900">
                      {r.label}
                      {r === fullRow && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-brand-100 text-brand-900">
                          KULLANIMA HAZIR
                        </span>
                      )}
                    </td>
                    {r.totals.map((v, i) => (
                      <td key={i} className="px-3 py-3 text-right tabular-nums">
                        {v > 0 ? (
                          <span className="font-semibold text-ink-900">{formatPriceWithSymbol(v)}</span>
                        ) : (
                          <span className="text-ink-500">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Tablo canlı katalogdan otomatik üretilir; sipariş anında geçerli fiyat ürün sayfasındaki
            konfigüratörde görünen fiyattır.
          </p>
        </section>

        {/* Nerede kullanılır */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">Roll-up nerede kullanılır?</h2>
          <p className="mt-2 text-ink-700 leading-relaxed">
            Roll-up, taşınabilir tanıtımın standart aracıdır: fuar ve kongre standları, mağaza/şube
            girişleri, etkinlik ve seminer sahneleri, kampanya köşeleri. Kendinden kasalı mekanizması
            sayesinde tek kişi tarafından dakikalar içinde kurulur, çantasıyla taşınır ve defalarca
            kullanılır. Sık kampanya değiştiren işletmeler ikinci kullanımda yalnız{" "}
            <strong>baskı yenileme</strong> (sadece mekanizma satırının farkı) maliyetiyle ilerler.
          </p>
        </section>

        {/* SSS + FAQPage JSON-LD */}
        <GuideFaqSection items={faqs} url={PAGE_PATH} />

        {/* CTA */}
        <section className="mt-14 p-8 md:p-12 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <Lightning size={28} weight="fill" className="text-brand-400 mx-auto mb-3" />
          <h2 className="text-2xl md:text-3xl font-semibold">Roll-up&apos;ını şimdi yapılandır</h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            İçerik ve adedi seç, fiyatı anında gör — KDV dahil fiyatlarla. Tasarım desteği ücretsiz.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/urun/${product.slug}`}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              Roll-Up Fiyatını Hesapla <ArrowRight size={14} weight="bold" />
            </Link>
            <Link
              href="/kategori/rollup"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Roll-Up Kategorisi
            </Link>
            <Link
              href="/teklif-al"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Toplu Sipariş Teklifi Al
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
