import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  IdentificationCard,
  CheckCircle,
  Info,
  ArrowRight,
  Truck,
  Lightning,
  PaintBrush,
} from "@phosphor-icons/react/dist/ssr";
import type { PricingOption } from "@markala/types";
import { getProductsByCategory, getProductBySlug } from "@/lib/catalog";
import { calculateTotal } from "@/lib/configurator";
import { formatPriceWithSymbol, formatPrice } from "@/lib/format";
import { BreadcrumbJsonLd, ArticleJsonLd } from "@/components/seo/json-ld";
import { GuideFaqSection, asOfLabel } from "../_shared";

// Fiyatlar canlı katalogdan SSR — saatte bir tazelenir (rehber içeriği için yeterli).
export const revalidate = 3600;

const PAGE_PATH = "/rehber/kartvizit-fiyatlari-2026";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Kartvizit Fiyatları 2026 — 1.000 Adet Kartvizit Ne Kadar? (KDV Dahil)",
    description:
      "2026 güncel kartvizit fiyatları: selefonlu, laklı, yaldızlı ve sıvama paketlerin 1.000–10.000 adet tiraj tablosu. Tüm fiyatlar KDV dahil — sepette değişmez.",
    alternates: { canonical: PAGE_PATH },
    openGraph: {
      type: "article",
      title: "Kartvizit Fiyatları 2026 — Güncel Tiraj Tablosu (KDV Dahil)",
      description:
        "Selefonlu, laklı ve sıvama kartvizit paketlerinin güncel fiyat tablosu. KDV dahil, canlı katalogdan.",
      url: PAGE_PATH,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Kartvizit Fiyatları 2026" }],
    },
  };
}

/** Selefon/paket türleri kısa seçim rehberi — baskı terminolojisi, fiyat içermez. */
const FINISH_GUIDE = [
  {
    name: "Mat selefon",
    desc: "En çok tercih edilen standart: yüzeye ince mat film kaplanır, parmak izi tutmaz, kurumsal ve sade bir doku verir.",
  },
  {
    name: "Parlak selefon",
    desc: "Renkleri daha canlı gösteren parlak film. Fotoğraf ve renkli tasarımlarda etkilidir; ışık altında yansıma yapar.",
  },
  {
    name: "Kabartma (lokal) lak",
    desc: "Logo veya yazı gibi seçili alanlara parlak, hafif kabarık lak uygulanır. Dokunulduğunda hissedilen premium bir detaydır.",
  },
  {
    name: "Yaldız (altın/gümüş)",
    desc: "Metalik folyo transferi. Logo ve isimde lüks algısı için kullanılır; koyu zeminlerde en iyi sonucu verir.",
  },
  {
    name: "Sıvama / özel kesim",
    desc: "İki kartonun sırt sırta yapıştırılmasıyla elde edilen ekstra kalın gövde; oval veya özel form kesimle birleşebilir.",
  },
];

export default async function KartvizitFiyatlariPage() {
  // Kategori listesi strict: API blip'inde throw → ISR son başarılı (stale) sayfayı korur.
  const listing = await getProductsByCategory("kartvizit", { strict: true });
  if (listing.length === 0) {
    throw new Error("rehber/kartvizit: kartvizit kategorisi boş döndü (API blip?) — stale ISR korunur");
  }
  const primarySlug = listing.find((p) => p.slug === "klasik-kartvizit")?.slug ?? listing[0]!.slug;
  const product = await getProductBySlug(primarySlug);
  if (!product || (product.options?.length ?? 0) === 0 || (product.prices?.length ?? 0) === 0) {
    throw new Error("rehber/kartvizit: ürün fiyat verisi boş (API blip?) — stale ISR korunur");
  }

  const opts = (product.options ?? []) as PricingOption[];
  const adetOpts = opts
    .filter((o) => o.groupKey === "adet" && o.groupRole === "dimension")
    .sort((a, b) => a.optionSort - b.optionSort);
  const pricedKey = opts
    .filter((o) => o.groupRole === "priced")
    .sort((a, b) => a.groupSort - b.groupSort)[0]?.groupKey;
  const paketOpts = pricedKey
    ? opts.filter((o) => o.groupKey === pricedKey).sort((a, b) => a.optionSort - b.optionSort)
    : [];
  if (adetOpts.length === 0 || paketOpts.length === 0 || !pricedKey) {
    throw new Error("rehber/kartvizit: beklenen opsiyon grupları yok — stale ISR korunur");
  }

  // Gösterilecek tiraj sütunları: 4'ten fazlaysa ilk iki + son iki (tablo taşmasın).
  const tiers = adetOpts.map((o) => ({ key: o.optionKey, label: o.optionLabel, qty: Number(o.optionKey) }));
  const shownTiers =
    tiers.length <= 4 ? tiers : [tiers[0]!, tiers[1]!, tiers[tiers.length - 2]!, tiers[tiers.length - 1]!];

  // Satırlar: her paket için seçili tirajlardaki GERÇEK toplam (canlı fiyat motoru).
  const rows = paketOpts
    .map((p) => ({
      key: p.optionKey,
      label: p.optionLabel,
      totals: shownTiers.map((t) => calculateTotal(product, { [pricedKey]: p.optionKey, adet: t.key })),
    }))
    .filter((r) => r.totals.some((v) => v > 0))
    .sort((a, b) => (a.totals[0]! > 0 ? a.totals[0]! : Infinity) - (b.totals[0]! > 0 ? b.totals[0]! : Infinity));
  if (rows.length === 0) {
    throw new Error("rehber/kartvizit: fiyat tablosu boş hesaplandı (API blip?) — stale ISR korunur");
  }

  const cheapest = rows[0]!;
  const minStart = cheapest.totals[0]!;
  const firstTier = shownTiers[0]!;
  const lastTier = shownTiers[shownTiers.length - 1]!;

  // Tiraj arttıkça birim fiyat düşüşü — en ekonomik paket üzerinden, gerçek veriden.
  const lastTotal = cheapest.totals[shownTiers.length - 1]!;
  const unitFirst = firstTier.qty > 0 ? minStart / firstTier.qty : 0;
  const unitLast = lastTier.qty > 0 && lastTotal > 0 ? lastTotal / lastTier.qty : 0;
  const savingsPct = unitFirst > 0 && unitLast > 0 ? Math.round((1 - unitLast / unitFirst) * 100) : 0;

  const asOf = asOfLabel();

  const faqs = [
    {
      q: `${firstTier.label.toLowerCase()} kartvizit kaç TL?`,
      a: `${asOf} itibarıyla katalog fiyatlarına göre ${firstTier.label.toLowerCase()} kartvizit ${formatPriceWithSymbol(minStart)}'den başlıyor (${cheapest.label} paketi). Bu fiyata KDV dahildir; sepette ek fark çıkmaz.`,
    },
    {
      q: "Fiyatlara KDV dahil mi?",
      a: "Evet. Bu sayfadaki ve ürün sayfasındaki tüm fiyatlar KDV dahildir; sepette gördüğün rakam ödediğin rakamdır. Kartvizit fiyatı karşılaştırırken listelenen fiyatın KDV dahil olup olmadığını mutlaka kontrol et — KDV hariç yazılan fiyat sepette artar.",
    },
    {
      q: "Selefonlu kartvizit ne demek?",
      a: "Selefon, baskı sonrası karta uygulanan ince koruyucu filmdir. Mat selefon sade ve parmak izi tutmayan bir doku verir, parlak selefon renkleri daha canlı gösterir. İki tür de kartın ömrünü uzatır.",
    },
    {
      q: "Kartvizit kaç günde teslim edilir?",
      a: `Üretim süresi ${product.productionTime || "1-2 iş günü"}; kargo Türkiye geneli 1-3 iş günü sürer. Sipariş durumu hesabından ve kargo takip sayfasından izlenebilir.`,
    },
    {
      q: "Tasarımım yok, ne yapmalıyım?",
      a: "Tasarım desteği ücretsizdir. Sipariş sırasında \"tasarım desteği istiyorum\" seçeneğini işaretlersen grafik ekibi kartvizitini hazırlar, onayından sonra baskıya alınır.",
    },
    {
      q: "Yüksek adetlerde birim fiyat düşüyor mu?",
      a:
        savingsPct >= 5
          ? `Evet. Örneğin ${cheapest.label} paketinde ${firstTier.label.toLowerCase()} yerine ${lastTier.label.toLowerCase()} sipariş ettiğinde adet başı maliyet yaklaşık %${savingsPct} düşer. Tablodaki tiraj sütunlarını karşılaştırarak görebilirsin.`
          : "Pakete göre değişir: bazı paketlerde tiraj büyüdükçe adet başı maliyet düşer, bazılarında sabittir. En doğrusu tablodaki tiraj sütunlarını ve ürün sayfasındaki konfigüratör fiyat ipuçlarını karşılaştırmak.",
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Kartvizit Fiyatları 2026", href: PAGE_PATH },
        ]}
      />
      <ArticleJsonLd
        title="Kartvizit Fiyatları 2026 — Güncel Tiraj Tablosu (KDV Dahil)"
        description="Selefonlu, laklı, yaldızlı ve sıvama kartvizit paketlerinin güncel fiyat tablosu ve seçim rehberi."
        url={PAGE_PATH}
        datePublished="2026-07-20"
      />

      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <IdentificationCard size={20} weight="fill" className="text-brand-700" />
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              Fiyat Rehberi
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Kartvizit fiyatları 2026: ne ödersin?
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            {firstTier.label} kartvizit{" "}
            <strong className="text-ink-900">{formatPriceWithSymbol(minStart)}</strong>&apos;den
            başlıyor — KDV dahil, sepette değişmez. Aşağıdaki tablo {asOf} itibarıyla canlı katalog
            fiyatlarıdır; ürün sayfasındaki konfigüratörle aynı motordan hesaplanır.
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
            <strong>Fiyat karşılaştırırken KDV&apos;ye dikkat:</strong> Online matbaa listelerinde
            fiyatlar çoğu zaman KDV hariç yazılır ve fark sepette ortaya çıkar. Bu sayfadaki tüm
            fiyatlar KDV dahildir — dürüst karşılaştırma için diğer teklifleri de sepet toplamı
            üzerinden kıyasla.
          </div>
        </section>

        {/* Fiyat tablosu */}
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">
            Güncel kartvizit fiyat tablosu ({asOf})
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            {product.sizeLabel ? `${product.sizeLabel} · ` : ""}Fiyatlar seçilen paket ve tiraja göre
            toplam tutardır, KDV dahildir.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5">Paket</th>
                  {shownTiers.map((t) => (
                    <th key={t.key} className="px-3 py-2.5 text-right">
                      {t.label}
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
          {savingsPct >= 5 && (
            <p className="mt-4 text-sm text-ink-700">
              <CheckCircle size={14} weight="fill" className="inline mr-1 text-success" />
              Tiraj büyüdükçe birim maliyet düşer: {cheapest.label} paketinde{" "}
              {lastTier.label.toLowerCase()} siparişte adet başı maliyet ({formatPrice(unitLast)} ₺),{" "}
              {firstTier.label.toLowerCase()} siparişe göre yaklaşık{" "}
              <strong className="text-ink-900">%{savingsPct} daha düşük</strong>.
            </p>
          )}
          <p className="mt-3 text-xs text-ink-500">
            Bu tablo canlı katalogdan otomatik üretilir ve düzenli olarak tazelenir; sipariş anında
            geçerli fiyat ürün sayfasındaki konfigüratörde görünen fiyattır.
          </p>
        </section>

        {/* Seçim rehberi */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">Hangi paketi seçmelisin?</h2>
          <p className="mt-2 text-ink-700">
            Paketler arasındaki fark kağıt-üstü işlemlerde: selefon türü, lak, yaldız ve gövde
            kalınlığı. Kısa rehber:
          </p>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {FINISH_GUIDE.map((f) => (
              <article key={f.name} className="p-5 bg-paper-50 border border-paper-200 rounded-xl">
                <h3 className="font-semibold text-ink-900">{f.name}</h3>
                <p className="mt-1.5 text-sm text-ink-700 leading-relaxed">{f.desc}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-700">
            Kararsızsan{" "}
            <Link href={`/urun/${product.slug}`} className="font-semibold text-brand-700 underline hover:text-ink-900">
              ürün sayfasındaki konfigüratörde
            </Link>{" "}
            paketleri seçtikçe fiyatın anında güncellendiğini görebilir,{" "}
            <Link href="/numune-talebi" className="font-semibold text-brand-700 underline hover:text-ink-900">
              numune talebi
            </Link>{" "}
            ile dokuları elinde inceleyebilirsin.
          </p>
        </section>

        {/* SSS + FAQPage JSON-LD */}
        <GuideFaqSection items={faqs} url={PAGE_PATH} />

        {/* CTA */}
        <section className="mt-14 p-8 md:p-12 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <Lightning size={28} weight="fill" className="text-brand-400 mx-auto mb-3" />
          <h2 className="text-2xl md:text-3xl font-semibold">Kartvizitini şimdi yapılandır</h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            Paket ve adedi seç, fiyatı anında gör — {formatPriceWithSymbol(minStart)}&apos;den
            başlayan KDV dahil fiyatlarla, üretim {product.productionTime || "1-2 iş günü"}.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/urun/${product.slug}`}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              Kartvizit Fiyatını Hesapla <ArrowRight size={14} weight="bold" />
            </Link>
            <Link
              href="/kategori/kartvizit"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Kartvizit Kategorisi
            </Link>
            <Link
              href="/fiyat-listesi"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Tüm Fiyat Listesi
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
