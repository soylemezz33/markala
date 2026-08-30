import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  Newspaper,
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

const PAGE_PATH = "/rehber/afis-baski-fiyatlari-2026";
const PRODUCT_SLUG = "afis-105gr";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Afiş Baskı Fiyatları 2026 — Ebat × Adet Tablosu (KDV Dahil)",
    description:
      "2026 güncel afiş bastırma fiyatları: 34×49 ve 49×69 cm ebat, 250–1.000 adet tiraj tablosu. Kuşe kağıda renkli baskı, tüm fiyatlar KDV dahil — sepette değişmez.",
    alternates: { canonical: PAGE_PATH },
    openGraph: {
      type: "article",
      title: "Afiş Baskı Fiyatları 2026 — Ebat × Adet Tablosu (KDV Dahil)",
      description:
        "Afiş bastırma fiyatları ebat ve tiraj kırılımıyla. KDV dahil, canlı katalogdan.",
      url: PAGE_PATH,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Afiş Baskı Fiyatları 2026" }],
    },
  };
}

export default async function AfisFiyatlariPage() {
  // Tek ürünlü kategori: fiyat ızgarası ürün detayından. API blip'inde throw → stale ISR korunur.
  const product = await getProductBySlug(PRODUCT_SLUG);
  if (!product || (product.prices?.length ?? 0) === 0) {
    throw new Error("rehber/afis: ürün/fiyat çekilemedi (API blip?) — stale ISR korunur");
  }

  const opts = (product.options ?? []) as PricingOption[];
  const adetOpts = opts
    .filter((o) => o.groupKey === "adet" && o.groupRole === "dimension")
    .sort((a, b) => a.optionSort - b.optionSort);
  // Fiyatlandıran grup (paket = ebat) dinamik bulunur — katalogda grup adı değişirse sayfa kırılmasın.
  const pricedKey = opts
    .filter((o) => o.groupRole === "priced")
    .sort((a, b) => a.groupSort - b.groupSort)[0]?.groupKey;
  const ebatOpts = pricedKey
    ? opts.filter((o) => o.groupKey === pricedKey).sort((a, b) => a.optionSort - b.optionSort)
    : [];
  if (adetOpts.length === 0 || ebatOpts.length === 0 || !pricedKey) {
    throw new Error("rehber/afis: beklenen opsiyon grupları yok — stale ISR korunur");
  }

  const rows = ebatOpts
    .map((e) => ({
      key: e.optionKey,
      label: e.optionLabel,
      totals: adetOpts.map((t) => calculateTotal(product, { [pricedKey]: e.optionKey, adet: t.optionKey })),
    }))
    .filter((r) => r.totals.some((v) => v > 0));
  if (rows.length === 0) {
    throw new Error("rehber/afis: fiyat tablosu boş hesaplandı (API blip?) — stale ISR korunur");
  }

  const asOf = asOfLabel();
  const firstTier = adetOpts[0]!;
  const minStart = Math.min(...rows.map((r) => r.totals[0]!).filter((v) => v > 0));

  const faqs = [
    {
      q: `${firstTier.optionLabel.toLowerCase()} afiş bastırmak ne kadar?`,
      a: `${asOf} itibarıyla katalog fiyatlarına göre ${firstTier.optionLabel.toLowerCase()} afiş ${formatPriceWithSymbol(minStart)}'den başlıyor (34×49 cm) — KDV dahil, sepette değişmez. Ebat ve adet kırılımı yukarıdaki tabloda.`,
    },
    {
      q: "Hangi afiş ebadını seçmeliyim?",
      a: "34×49 cm; vitrin, pano ve kapalı alan duyuruları için kompakt ve ekonomik boydur. 49×69 cm; sokak, etkinlik ve uzaktan okunması gereken kampanya afişlerinde tercih edilir. Kararsızsan asılacağı mesafeyi düşün: 3-4 metreden okunacaksa büyük ebat seç.",
    },
    {
      q: '"Tek yön renkli" ne demek?',
      a: "Baskı yalnızca ön yüze yapılır (afişin arkası boş kalır) — afiş zaten duvara/panoya asıldığı için standart budur. Kağıt 105 gr kuşedir: canlı renk veren, ekonomik afiş kağıdı.",
    },
    {
      q: "Fiyatlara KDV dahil mi?",
      a: "Evet, tablodaki ve ürün sayfasındaki tüm fiyatlar KDV dahildir. Afiş fiyatı karşılaştırırken teklifin KDV dahil olup olmadığını kontrol et — hariç verilen fiyat sepette artar.",
    },
    {
      q: "Afiş kaç günde teslim edilir?",
      a: `Üretim süresi ${product.productionTime || "2-3 iş günü"}; kargo Türkiye geneli 1-3 iş günü sürer. Etkinlik/kampanya tarihine birkaç gün pay bırakmanı öneririz.`,
    },
    {
      q: "Tasarımım yok, afişi kim hazırlayacak?",
      a: "Her siparişte tasarım desteği ücretsiz: metnini, logonu ve görselini gönder; baskıya hazır afiş tasarımını ekibimiz hazırlayıp onayına sunar. Onaysız dosya baskıya girmez.",
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Afiş Baskı Fiyatları 2026", href: PAGE_PATH },
        ]}
      />
      <ArticleJsonLd
        title="Afiş Baskı Fiyatları 2026 — Ebat × Adet Tablosu (KDV Dahil)"
        description="34×49 ve 49×69 cm afiş baskı fiyatları, tiraj kırılımı ve ebat seçim rehberi."
        url={PAGE_PATH}
        datePublished="2026-08-01"
      />

      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Newspaper size={20} weight="fill" className="text-brand-700" />
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              Fiyat Rehberi
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Afiş baskı fiyatları 2026: ne ödersin?
          </h1>
          <HizliCevap
            soru="Afiş baskı fiyatı nasıl hesaplanır?"
            cevap="Afiş fiyatı ebat, kâğıt cinsi ve adede göre hesaplanır; tabloda güncel ebat-adet kırılımı yer alır. Fiyatlar KDV dahildir; üretim genellikle 2-3 iş günü sürer ve sipariş Türkiye geneline kargolanır."
          />
          <p className="mt-4 text-lg text-ink-700">
            {firstTier.optionLabel.toLowerCase()} afiş{" "}
            <strong className="text-ink-900">{formatPriceWithSymbol(minStart)}</strong>&apos;den
            başlıyor — KDV dahil, sepette değişmez. Tablo {asOf} itibarıyla canlı katalog
            fiyatlarıdır; ebat ve adet kırılımıyla.
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
            <strong>Fiyat karşılaştırırken KDV&apos;ye dikkat:</strong> Afiş fiyatları birçok
            listede KDV hariç yazılır; fark sepette ortaya çıkar. Buradaki tüm fiyatlar KDV
            dahildir — teklifleri sepet toplamı üzerinden kıyasla.
          </div>
        </section>

        {/* Ebat × adet tablosu */}
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">
            {product.name} — ebat × adet fiyat tablosu ({asOf})
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            Fiyatlar seçilen ebat ve adede göre toplam tutardır, KDV dahildir.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5">Ebat</th>
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
                    <td className="px-3 py-3 font-medium text-ink-900">{r.label}</td>
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

        {/* Kullanım rehberi */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">Afiş nerede işe yarar?</h2>
          <p className="mt-2 text-ink-700 leading-relaxed">
            Afiş, birim maliyeti en düşük yerel görünürlük aracıdır: mağaza vitrini, etkinlik
            duyurusu, kampanya panosu, okul/kurum ilanları. Aynı tasarımı yüksek adetle bastırıp
            bölge bölge astırmak, yerel kampanyalarda dijital reklamı tamamlayan en ucuz erişim
            yoludur. Dış cephe ve uzun süreli kullanım içinse{" "}
            <Link href="/kategori/vinil-branda-afis" className="font-semibold text-brand-700 underline hover:text-ink-900">
              vinil branda
            </Link>{" "}
            daha dayanıklıdır — kağıt afiş kapalı/korunaklı alanlar içindir.
          </p>
        </section>

        {/* SSS + FAQPage JSON-LD */}
        <GuideFaqSection items={faqs} url={PAGE_PATH} />

        {/* CTA */}
        <section className="mt-14 p-8 md:p-12 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <Lightning size={28} weight="fill" className="text-brand-400 mx-auto mb-3" />
          <h2 className="text-2xl md:text-3xl font-semibold">Afişini şimdi yapılandır</h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            Ebat ve adedi seç, fiyatı anında gör — {formatPriceWithSymbol(minStart)}&apos;den
            başlayan KDV dahil fiyatlarla. Tasarım desteği ücretsiz.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/urun/${product.slug}`}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              Afiş Fiyatını Hesapla <ArrowRight size={14} weight="bold" />
            </Link>
            <Link
              href="/kategori/afis"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Afiş Kategorisi
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
