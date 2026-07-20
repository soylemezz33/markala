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
import type { PricingOption, Product } from "@markala/types";
import { getProductsByCategory, getProductBySlug } from "@/lib/catalog";
import { calculateTotal, getDisplayPrice } from "@/lib/configurator";
import { formatPriceWithSymbol, formatPriceDisplay } from "@/lib/format";
import { BreadcrumbJsonLd, ArticleJsonLd } from "@/components/seo/json-ld";
import { GuideFaqSection, asOfLabel } from "../_shared";

// Fiyatlar canlı katalogdan SSR — saatte bir tazelenir.
export const revalidate = 3600;

const PAGE_PATH = "/rehber/brosur-baski-fiyatlari-2026";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Broşür Baskı Fiyatları 2026 — A5/A4 El İlanı Ne Kadar? (KDV Dahil)",
    description:
      "2026 güncel broşür ve el ilanı baskı fiyatları: A7'den A3'e ebat, 1.000–10.000 adet tiraj tablosu ve kağıt seçim rehberi. Tüm fiyatlar KDV dahil — sepette değişmez.",
    alternates: { canonical: PAGE_PATH },
    openGraph: {
      type: "article",
      title: "Broşür Baskı Fiyatları 2026 — Ebat × Tiraj Tablosu (KDV Dahil)",
      description:
        "A5 ve A4 broşür/el ilanı fiyatları ebat ve tiraj kırılımıyla. KDV dahil, canlı katalogdan.",
      url: PAGE_PATH,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Broşür Baskı Fiyatları 2026" }],
    },
  };
}

export default async function BrosurFiyatlariPage() {
  // Kategori listesi strict: API blip'inde throw → ISR stale sayfayı korur.
  const listing = await getProductsByCategory("brosur", { strict: true });
  if (listing.length === 0) {
    throw new Error("rehber/brosur: broşür kategorisi boş döndü (API blip?) — stale ISR korunur");
  }
  // Tam fiyat ızgarası (options+prices) detay endpoint'inde — her ürünü tam çek.
  const details = (await Promise.all(listing.map((p) => getProductBySlug(p.slug)))).filter(
    (p): p is Product => p != null,
  );
  const gridCandidates = details.filter(
    (p) =>
      (p.prices?.length ?? 0) > 0 &&
      (p.options ?? []).some((o) => o.groupKey === "adet" && o.groupRole === "dimension"),
  );
  if (gridCandidates.length === 0) {
    throw new Error("rehber/brosur: fiyat ızgaralı broşür ürünü bulunamadı (API blip?) — stale ISR korunur");
  }
  // Ana tablo: en ekonomik başlangıç fiyatlı ürünün ebat × tiraj ızgarası.
  const matrix = gridCandidates.reduce((a, b) => (getDisplayPrice(a) <= getDisplayPrice(b) ? a : b));

  const opts = (matrix.options ?? []) as PricingOption[];
  const adetOpts = opts
    .filter((o) => o.groupKey === "adet" && o.groupRole === "dimension")
    .sort((a, b) => a.optionSort - b.optionSort);
  const pricedKey = opts
    .filter((o) => o.groupRole === "priced")
    .sort((a, b) => a.groupSort - b.groupSort)[0]?.groupKey;
  const ebatOpts = pricedKey
    ? opts.filter((o) => o.groupKey === pricedKey).sort((a, b) => a.optionSort - b.optionSort)
    : [];
  if (adetOpts.length === 0 || ebatOpts.length === 0 || !pricedKey) {
    throw new Error("rehber/brosur: beklenen opsiyon grupları yok — stale ISR korunur");
  }

  const tiers = adetOpts.map((o) => ({ key: o.optionKey, label: o.optionLabel, qty: Number(o.optionKey) }));
  const shownTiers =
    tiers.length <= 4 ? tiers : [tiers[0]!, tiers[1]!, tiers[tiers.length - 2]!, tiers[tiers.length - 1]!];

  const rows = ebatOpts
    .map((e) => ({
      key: e.optionKey,
      label: e.optionLabel,
      totals: shownTiers.map((t) => calculateTotal(matrix, { [pricedKey]: e.optionKey, adet: t.key })),
    }))
    .filter((r) => r.totals.some((v) => v > 0));
  if (rows.length === 0) {
    throw new Error("rehber/brosur: fiyat tablosu boş hesaplandı (API blip?) — stale ISR korunur");
  }

  const firstTier = shownTiers[0]!;
  const asOf = asOfLabel();
  const minStart = Math.min(...rows.map((r) => r.totals[0]!).filter((v) => v > 0));
  const a5Row = rows.find((r) => r.label.toUpperCase().includes("A5"));
  const a4Row = rows.find((r) => r.label.toUpperCase().includes("A4"));

  // Diğer broşür ürünleri (kağıt/işlem farkı) — başlangıç fiyatı kartları.
  const productCards = [...details].sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));

  const faqs = [
    {
      q: `${firstTier.label.toLowerCase()} A5 el ilanı ne kadar?`,
      a:
        a5Row && a5Row.totals[0]! > 0
          ? `${asOf} itibarıyla katalog fiyatlarına göre ${firstTier.label.toLowerCase()} A5 broşür (${matrix.name}) ${formatPriceWithSymbol(a5Row.totals[0]!)} — KDV dahil, sepette değişmez.`
          : `${asOf} itibarıyla broşür baskısı ${formatPriceWithSymbol(minStart)}'den başlıyor; ebat bazlı güncel fiyatlar yukarıdaki tabloda, KDV dahildir.`,
    },
    {
      q: "Broşür ile el ilanı arasındaki fark ne?",
      a: "Günlük kullanımda ikisi de tek yaprak baskıyı anlatır. El ilanı genellikle dağıtım amaçlı, daha ince kağıda basılan üründür; broşür ise daha kaliteli kağıt veya selefonlu yüzeyle kurumsal tanıtımda kullanılır. Katalogda gramaj ve işlem farkı ürün adında belirtilir.",
    },
    {
      q: "Hangi ebadı seçmeliyim?",
      a: "Sokak ve etkinlik dağıtımında A5 en yaygın tercihtir: maliyeti düşük, eldeki taşıması kolay. Ürün/hizmet detayı anlatan tanıtımlarda A4, masa üstü küçük duyurularda A7 kullanılır. A3 daha çok menü ve poster-vari kullanım içindir.",
    },
    {
      q: "Fiyatlara KDV dahil mi?",
      a: "Evet, tablodaki ve ürün sayfalarındaki tüm fiyatlar KDV dahildir. Broşür fiyatı karşılaştırırken tekliflerin KDV dahil olup olmadığını kontrol et — KDV hariç listelenen fiyat sepette artar.",
    },
    {
      q: "Kağıt gramajı fiyatı nasıl etkiler?",
      a: "Gramaj yükseldikçe (ör. 115 gr → 200 gr kuşe) kağıt maliyeti ve dolayısıyla fiyat artar; buna karşılık broşür daha tok ve kaliteli hissedilir. Selefon gibi yüzey işlemleri de fiyata eklenir. Aynı ebat ve adedi farklı ürünlerde karşılaştırarak seçim yapabilirsin.",
    },
    {
      q: "Broşür kaç günde teslim edilir?",
      a: `Üretim süresi ${matrix.productionTime || "1-2 iş günü"}; kargo Türkiye geneli 1-3 iş günü sürer. Yoğun kampanya dönemleri için siparişi dağıtım tarihinden birkaç gün önce vermeni öneririz.`,
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Broşür Baskı Fiyatları 2026", href: PAGE_PATH },
        ]}
      />
      <ArticleJsonLd
        title="Broşür Baskı Fiyatları 2026 — Ebat × Tiraj Tablosu (KDV Dahil)"
        description="A7'den A3'e broşür ve el ilanı baskı fiyatları, tiraj kırılımı ve kağıt seçim rehberi."
        url={PAGE_PATH}
        datePublished="2026-07-20"
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
            Broşür baskı fiyatları 2026: ne ödersin?
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            {firstTier.label.toLowerCase()} broşür{" "}
            <strong className="text-ink-900">{formatPriceWithSymbol(minStart)}</strong>&apos;den
            başlıyor — KDV dahil, sepette değişmez. Tablo {asOf} itibarıyla canlı katalog
            fiyatlarıdır; ebat ve tiraj kırılımıyla.
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
            <strong>Fiyat karşılaştırırken KDV&apos;ye dikkat:</strong> Broşür fiyatları birçok
            listede KDV hariç yazılır; fark sepette ortaya çıkar. Buradaki tüm fiyatlar KDV
            dahildir — teklifleri sepet toplamı üzerinden kıyaslamak en dürüst yöntemdir.
          </div>
        </section>

        {/* Ebat × tiraj tablosu */}
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">
            {matrix.name} — ebat × tiraj fiyat tablosu ({asOf})
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            {matrix.sizeLabel ? `${matrix.sizeLabel} · ` : ""}Fiyatlar seçilen ebat ve tiraja göre
            toplam tutardır, KDV dahildir.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5">Ebat</th>
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
                    <td className="px-3 py-3 font-medium text-ink-900">
                      {r.label}
                      {(r === a5Row || r === a4Row) && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-brand-100 text-brand-900">
                          YAYGIN
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

        {/* Ürün karşılaştırma kartları */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">Kağıt ve işleme göre broşür seçenekleri</h2>
          <p className="mt-2 text-ink-700">
            Katalogda farklı kağıt gramajı ve yüzey işlemiyle birden fazla broşür ürünü var — bütçene
            ve kullanım amacına göre seç:
          </p>
          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {productCards.map((p) => (
              <article key={p.slug} className="p-5 bg-paper-50 border border-paper-200 rounded-xl flex flex-col">
                <h3 className="font-semibold text-ink-900">{p.name}</h3>
                {p.sizeLabel && <p className="mt-1 text-xs text-ink-500">{p.sizeLabel}</p>}
                <p className="mt-3 text-sm text-ink-700">
                  <span className="font-semibold text-ink-900 tabular-nums">
                    {formatPriceDisplay(getDisplayPrice(p))}
                  </span>
                  {getDisplayPrice(p) > 0 && <span className="text-xs text-ink-500 ml-1">&apos;den</span>}
                </p>
                <Link
                  href={`/urun/${p.slug}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-ink-900"
                >
                  Fiyatını hesapla <ArrowRight size={11} weight="bold" />
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-700">
            Tüm broşür ürünlerini{" "}
            <Link href="/kategori/brosur" className="font-semibold text-brand-700 underline hover:text-ink-900">
              broşür / el ilanı kategorisinde
            </Link>{" "}
            karşılaştırabilir, diğer ürün gruplarını{" "}
            <Link href="/fiyat-listesi" className="font-semibold text-brand-700 underline hover:text-ink-900">
              genel fiyat listesinde
            </Link>{" "}
            görebilirsin.
          </p>
        </section>

        {/* SSS + FAQPage JSON-LD */}
        <GuideFaqSection items={faqs} url={PAGE_PATH} />

        {/* CTA */}
        <section className="mt-14 p-8 md:p-12 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <Lightning size={28} weight="fill" className="text-brand-400 mx-auto mb-3" />
          <h2 className="text-2xl md:text-3xl font-semibold">Broşürünü şimdi yapılandır</h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            Ebat ve tirajı seç, fiyatı anında gör — {formatPriceWithSymbol(minStart)}&apos;den
            başlayan KDV dahil fiyatlarla. Tasarım desteği ücretsiz.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/urun/${matrix.slug}`}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              Broşür Fiyatını Hesapla <ArrowRight size={14} weight="bold" />
            </Link>
            <Link
              href="/kategori/brosur"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Broşür Kategorisi
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
