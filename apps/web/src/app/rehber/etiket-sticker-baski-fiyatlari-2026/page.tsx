import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  Sticker,
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

const PAGE_PATH = "/rehber/etiket-sticker-baski-fiyatlari-2026";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Etiket & Sticker Baskı Fiyatları 2026 — 1.000 Adet Ne Kadar? (KDV Dahil)",
    description:
      "2026 güncel yapışkanlı etiket ve sticker baskı fiyatları: selefonlu, selefonsuz, özel kesim ve altın yaldız seçenekleri. 1.000 adet fiyat tablosu — KDV dahil, sepette değişmez.",
    alternates: { canonical: PAGE_PATH },
    openGraph: {
      type: "article",
      title: "Etiket & Sticker Baskı Fiyatları 2026 — Varyant Tablosu (KDV Dahil)",
      description:
        "Yapışkanlı etiket ve sticker fiyatları varyant kırılımıyla. KDV dahil, canlı katalogdan.",
      url: PAGE_PATH,
      images: [
        { url: "/og-default.png", width: 1200, height: 630, alt: "Etiket & Sticker Baskı Fiyatları 2026" },
      ],
    },
  };
}

export default async function EtiketStickerFiyatlariPage() {
  // Kategori listesi strict: API blip'inde throw → ISR stale sayfayı korur.
  const listing = await getProductsByCategory("etiket", { strict: true });
  if (listing.length === 0) {
    throw new Error("rehber/etiket: etiket kategorisi boş döndü (API blip?) — stale ISR korunur");
  }
  const details = (await Promise.all(listing.map((p) => getProductBySlug(p.slug)))).filter(
    (p): p is Product => p != null,
  );
  const gridCandidates = details.filter(
    (p) =>
      (p.prices?.length ?? 0) > 0 &&
      (p.options ?? []).some((o) => o.groupKey === "adet" && o.groupRole === "dimension"),
  );
  if (gridCandidates.length === 0) {
    throw new Error("rehber/etiket: fiyat ızgaralı etiket ürünü bulunamadı (API blip?) — stale ISR korunur");
  }
  // Ana tablo: en ekonomik başlangıç fiyatlı ürünün varyant × tiraj ızgarası.
  const matrix = gridCandidates.reduce((a, b) => (getDisplayPrice(a) <= getDisplayPrice(b) ? a : b));

  const opts = (matrix.options ?? []) as PricingOption[];
  const adetOpts = opts
    .filter((o) => o.groupKey === "adet" && o.groupRole === "dimension")
    .sort((a, b) => a.optionSort - b.optionSort);
  const pricedKey = opts
    .filter((o) => o.groupRole === "priced")
    .sort((a, b) => a.groupSort - b.groupSort)[0]?.groupKey;
  const variantOpts = pricedKey
    ? opts.filter((o) => o.groupKey === pricedKey).sort((a, b) => a.optionSort - b.optionSort)
    : [];
  if (adetOpts.length === 0 || variantOpts.length === 0 || !pricedKey) {
    throw new Error("rehber/etiket: beklenen opsiyon grupları yok — stale ISR korunur");
  }

  const tiers = adetOpts.map((o) => ({ key: o.optionKey, label: o.optionLabel }));
  const shownTiers =
    tiers.length <= 4 ? tiers : [tiers[0]!, tiers[1]!, tiers[tiers.length - 2]!, tiers[tiers.length - 1]!];

  const rows = variantOpts
    .map((v) => ({
      key: v.optionKey,
      label: v.optionLabel,
      totals: shownTiers.map((t) => calculateTotal(matrix, { [pricedKey]: v.optionKey, adet: t.key })),
    }))
    .filter((r) => r.totals.some((val) => val > 0));
  if (rows.length === 0) {
    throw new Error("rehber/etiket: fiyat tablosu boş hesaplandı (API blip?) — stale ISR korunur");
  }

  const firstTier = shownTiers[0]!;
  const asOf = asOfLabel();
  const minStart = Math.min(...rows.map((r) => r.totals[0]!).filter((v) => v > 0));

  const productCards = [...details].sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));

  const faqs = [
    {
      q: `${firstTier.label.toLowerCase()} etiket baskı ne kadar?`,
      a: `${asOf} itibarıyla katalog fiyatlarına göre ${firstTier.label.toLowerCase()} yapışkanlı etiket (${matrix.name}) ${formatPriceWithSymbol(minStart)}'den başlıyor — KDV dahil, sepette değişmez. Varyant bazlı güncel fiyatlar yukarıdaki tabloda.`,
    },
    {
      q: "Etiket ile sticker arasındaki fark ne?",
      a: "Teknik olarak aynı üründür: arkası yapışkanlı baskı. Günlük kullanımda ambalaj/kavanoz/kargo üzerine yapıştırılan ürünlere etiket, logo-maskot gibi tanıtım amaçlı kesimli ürünlere sticker denir. Katalogdaki 90 gr kuşe çıkartma her iki kullanım için uygundur.",
    },
    {
      q: "Selefonlu mu selefonsuz mu seçmeliyim?",
      a: "Nem, yağ veya sık el temasına maruz kalacak yüzeylerde (kavanoz, şişe, kozmetik ambalajı) parlak selefon dayanıklılığı belirgin artırır. Kuru ortamda kısa ömürlü kullanım (kargo paketi, promosyon) için selefonsuz yeterlidir ve daha ekonomiktir.",
    },
    {
      q: "Özel kesim (şekilli) sticker yaptırabilir miyim?",
      a: "Evet — Özel Kesim Selefon seçeneğiyle logonuzun/tasarımınızın konturuna göre şekilli kesim yapılır. Tasarımını yükle, kesim hattını ücretsiz tasarım desteğimiz hazırlasın.",
    },
    {
      q: "Fiyatlara KDV dahil mi?",
      a: "Evet, tablodaki ve ürün sayfalarındaki tüm fiyatlar KDV dahildir. Etiket fiyatı karşılaştırırken tekliflerin KDV dahil olup olmadığını kontrol et — KDV hariç listelenen fiyat sepette artar.",
    },
    {
      q: "Etiketler kaç günde teslim edilir?",
      a: `Üretim süresi ${matrix.productionTime || "1-2 iş günü"}; kargo Türkiye geneli 1-3 iş günü sürer. Ürün lansmanı veya kampanya dönemi için siparişi birkaç gün önceden vermeni öneririz.`,
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Etiket & Sticker Baskı Fiyatları 2026", href: PAGE_PATH },
        ]}
      />
      <ArticleJsonLd
        title="Etiket & Sticker Baskı Fiyatları 2026 — Varyant Tablosu (KDV Dahil)"
        description="Yapışkanlı etiket ve sticker baskı fiyatları, varyant kırılımı ve kullanım rehberi."
        url={PAGE_PATH}
        datePublished="2026-08-04"
      />

      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Sticker size={20} weight="fill" className="text-brand-700" />
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              Fiyat Rehberi
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Etiket &amp; sticker baskı fiyatları 2026: ne ödersin?
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            {firstTier.label.toLowerCase()} yapışkanlı etiket{" "}
            <strong className="text-ink-900">{formatPriceWithSymbol(minStart)}</strong>&apos;den
            başlıyor — KDV dahil, sepette değişmez. Tablo {asOf} itibarıyla canlı katalog
            fiyatlarıdır; selefon ve kesim varyantı kırılımıyla.
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
            <strong>Fiyat karşılaştırırken KDV&apos;ye dikkat:</strong> Etiket ve sticker
            fiyatları birçok listede KDV hariç yazılır; fark sepette ortaya çıkar. Buradaki tüm
            fiyatlar KDV dahildir — teklifleri sepet toplamı üzerinden kıyaslamak en dürüst
            yöntemdir.
          </div>
        </section>

        {/* Varyant × tiraj tablosu */}
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">
            {matrix.name} — varyant fiyat tablosu ({asOf})
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            {matrix.sizeLabel ? `${matrix.sizeLabel} · ` : ""}Fiyatlar seçilen varyant ve adede
            göre toplam tutardır, KDV dahildir.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5">Varyant</th>
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
          <p className="mt-3 text-xs text-ink-500">
            Tablo canlı katalogdan otomatik üretilir; sipariş anında geçerli fiyat ürün sayfasındaki
            konfigüratörde görünen fiyattır.
          </p>
        </section>

        {/* Kullanım alanı rehberi */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">Hangi etiket hangi işe uygun?</h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            {[
              {
                title: "Ürün ambalajı & kavanoz/şişe",
                desc: "Parlak selefonlu varyant — nem ve el temasına dayanıklı, rafta canlı renk.",
              },
              {
                title: "Kargo paketi & koli",
                desc: "Selefonsuz varyant yeterli — kısa ömürlü kullanım, en ekonomik seçenek.",
              },
              {
                title: "Logo sticker & maskot",
                desc: "Özel kesim selefon — tasarımın konturuna göre şekilli kesim, tanıtımda fark yaratır.",
              },
              {
                title: "Premium ambalaj & davetli kutusu",
                desc: "Altın yaldız varyantı — butik ürünlerde lüks algısı, düşük adette bile etkili.",
              },
            ].map((u) => (
              <article key={u.title} className="p-5 bg-paper-50 border border-paper-200 rounded-xl">
                <h3 className="font-semibold text-ink-900">{u.title}</h3>
                <p className="mt-2 text-sm text-ink-700">{u.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Ürün kartları */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">Katalogdaki etiket ürünleri</h2>
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
            Tüm yapışkanlı ürünleri{" "}
            <Link href="/kategori/etiket" className="font-semibold text-brand-700 underline hover:text-ink-900">
              etiket kategorisinde
            </Link>{" "}
            karşılaştırabilir, araç kaplama ve cam yazıları için{" "}
            <Link href="/kategori/folyo" className="font-semibold text-brand-700 underline hover:text-ink-900">
              folyo kategorisine
            </Link>{" "}
            bakabilirsin.
          </p>
        </section>

        {/* SSS + FAQPage JSON-LD */}
        <GuideFaqSection items={faqs} url={PAGE_PATH} />

        {/* CTA */}
        <section className="mt-14 p-8 md:p-12 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <Lightning size={28} weight="fill" className="text-brand-400 mx-auto mb-3" />
          <h2 className="text-2xl md:text-3xl font-semibold">Etiketini şimdi yapılandır</h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            Varyantı seç, fiyatı anında gör — {formatPriceWithSymbol(minStart)}&apos;den başlayan
            KDV dahil fiyatlarla. Tasarım desteği ücretsiz.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/urun/${matrix.slug}`}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              Etiket Fiyatını Hesapla <ArrowRight size={14} weight="bold" />
            </Link>
            <Link
              href="/kategori/etiket"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Etiket Kategorisi
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
