import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  Storefront,
  CheckCircle,
  Info,
  ArrowRight,
  Truck,
  Lightning,
  PaintBrush,
} from "@phosphor-icons/react/dist/ssr";
import type { Product } from "@markala/types";
import { getProductsByCategory } from "@/lib/catalog";
import { getDisplayPrice } from "@/lib/configurator";
import { formatPriceWithSymbol } from "@/lib/format";
import { BreadcrumbJsonLd, ArticleJsonLd } from "@/components/seo/json-ld";
import { GuideFaqSection, asOfLabel } from "../_shared";

// Fiyatlar canlı katalogdan SSR — saatte bir tazelenir.
export const revalidate = 3600;

const PAGE_PATH = "/rehber/tabela-fiyatlari-2026";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Tabela Fiyatları 2026 — Dekota, Folyo ve Branda Karşılaştırması (KDV Dahil)",
    description:
      "2026 güncel tabela fiyatları: dekota levha tabela, folyo kesim cam yazısı ve vinil branda karşılaştırması. Hangi işletmeye hangi tabela — başlangıç fiyatlarıyla, KDV dahil.",
    alternates: { canonical: PAGE_PATH },
    openGraph: {
      type: "article",
      title: "Tabela Fiyatları 2026 — Dekota, Folyo, Branda (KDV Dahil)",
      description:
        "Dükkan ve ofis tabelası çözümleri: malzeme karşılaştırması ve canlı katalog fiyatları.",
      url: PAGE_PATH,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Tabela Fiyatları 2026" }],
    },
  };
}

/**
 * Tabela çözümü sınıfları — katalogdaki üç malzeme ailesi.
 * Fiyat canlıdan gelir; sınıf açıklamaları statik seçim rehberidir.
 */
const SOLUTIONS = [
  {
    categorySlug: "dekota-baski",
    name: "Dekota levha tabela",
    desc: "Sert PVC köpük levhaya doğrudan UV baskı. İç ve dış mekânda dükkan/ofis tabelası, yönlendirme panosu ve kapı isimliği için en yaygın çözüm — hafif, dayanıklı ve boyanmaz.",
    ideal: "Dükkan cephesi, ofis kapısı, yönlendirme, İSG panoları",
  },
  {
    categorySlug: "folyo",
    name: "Folyo kesim yazı",
    desc: "Kesim plotterda harf harf kesilen yapışkanlı folyo. Cam vitrine, araca ve duvara uygulanır; zemin görünür kaldığı için modern ve sade durur. Tabela yaptırmadan vitrini markalamanın en ekonomik yolu.",
    ideal: "Vitrin camı, çalışma saatleri, araç yazısı, duvar sloganı",
  },
  {
    categorySlug: "vinil-branda-afis",
    name: "Vinil branda",
    desc: "Kuşgözlü (halkalı) dayanıklı branda. Büyük cepheleri en düşük maliyetle kaplar; inşaat sahası, kampanya duyurusu ve geçici tabela ihtiyacında metrekare başına en uygun çözümdür.",
    ideal: "İnşaat/şantiye cephesi, kampanya, etkinlik, geçici tabela",
  },
];

export default async function TabelaFiyatlariPage() {
  // Üç malzeme ailesinin listesi canlıdan — biri bile boşsa API blip kabul edilir (stale ISR korunur).
  const listings = await Promise.all(
    SOLUTIONS.map((s) => getProductsByCategory(s.categorySlug, { strict: true })),
  );
  if (listings.some((l) => l.length === 0)) {
    throw new Error("rehber/tabela: en az bir malzeme kategorisi boş döndü (API blip?) — stale ISR korunur");
  }

  const asOf = asOfLabel();
  const cards = SOLUTIONS.map((s, i) => {
    const products = listings[i]!.filter((p) => getDisplayPrice(p) > 0);
    const cheapest =
      products.length > 0
        ? products.reduce((a: Product, b: Product) => (getDisplayPrice(a) <= getDisplayPrice(b) ? a : b))
        : null;
    return { ...s, cheapest, minPrice: cheapest ? getDisplayPrice(cheapest) : 0 };
  });
  const priced = cards.filter((c) => c.minPrice > 0);
  if (priced.length === 0) {
    throw new Error("rehber/tabela: hiçbir kategoride fiyatlı ürün yok (API blip?) — stale ISR korunur");
  }
  const minStart = Math.min(...priced.map((c) => c.minPrice));

  const faqs = [
    {
      q: "Tabela fiyatı neye göre değişir?",
      a: "Üç ana etken: malzeme (dekota / folyo / branda), ebat (metrekare) ve montaj aksesuarları. Aynı ebatta folyo kesim en ekonomik, dekota levha orta, ışıklı-kutu harf sistemleri (katalogda yok, teklifle) en yüksek segmenttir. Buradaki fiyatlar KDV dahildir.",
    },
    {
      q: "Dükkanım için hangi tabela tipini seçmeliyim?",
      a: "Cephe tabelası için dekota levha dengeli seçimdir: dış mekâna dayanıklı, hafif ve montajı kolay. Vitrin camını değerlendirmek istersen folyo kesim yazı ekonomik bir başlangıçtır; büyük cephe veya geçici duyuru için vinil branda metrekare başına en uygun çözümdür.",
    },
    {
      q: "Işıklı tabela yapıyor musunuz?",
      a: "Işıklı kutu harf ve leke tabela projeleri ölçü ve keşif gerektirdiği için katalog yerine teklif akışıyla ilerler — teklif formundan ölçü ve fotoğraf göndererek fiyat alabilirsin.",
    },
    {
      q: "Tabela montajı sizde mi?",
      a: "Mersin ve çevresinde montaj hizmeti veriyoruz; diğer illere ürün kuşgözlü/delikli montaja hazır gönderilir. Branda kuşgözleriyle, dekota levha ise çift taraflı bant veya vida ile kolayca uygulanır.",
    },
    {
      q: "Fiyatlara KDV dahil mi?",
      a: "Evet — tablodaki ve ürün sayfalarındaki tüm fiyatlar KDV dahildir. Tabela teklifi kıyaslarken KDV ve montajın dahil olup olmadığını mutlaka sor; fark sepette/faturada ortaya çıkar.",
    },
    {
      q: "Kaç günde teslim edilir?",
      a: "Baskılı ürünlerde üretim genellikle 1-2 iş günü, kargo Türkiye geneli 1-3 iş günüdür. Ebatlı büyük brandalarda rulo kargo süresi 1 gün uzayabilir.",
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Tabela Fiyatları 2026", href: PAGE_PATH },
        ]}
      />
      <ArticleJsonLd
        title="Tabela Fiyatları 2026 — Dekota, Folyo ve Branda Karşılaştırması"
        description="Dükkan ve ofis tabelası çözümlerinin malzeme karşılaştırması ve güncel başlangıç fiyatları."
        url={PAGE_PATH}
        datePublished="2026-08-04"
      />

      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Storefront size={20} weight="fill" className="text-brand-700" />
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              Fiyat Rehberi
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Tabela fiyatları 2026: hangi malzeme, ne kadar?
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Tabela çözümleri <strong className="text-ink-900">{formatPriceWithSymbol(minStart)}</strong>
            &apos;den başlıyor — KDV dahil, sepette değişmez. {asOf} itibarıyla canlı katalog
            fiyatlarıyla dekota levha, folyo kesim ve vinil branda karşılaştırması.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/15 text-success rounded-full font-medium">
              <CheckCircle size={13} weight="fill" /> KDV dahil — sepette değişmez
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-900 rounded-full font-medium">
              <PaintBrush size={13} weight="fill" /> Ücretsiz tasarım desteği
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-200 text-ink-900 rounded-full font-medium">
              <Truck size={13} weight="fill" /> Montaja hazır gönderim
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-10 md:py-14 max-w-4xl">
        {/* Dürüst kapsam notu */}
        <section className="mb-10 p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Info size={20} weight="fill" className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 leading-relaxed">
            <strong>Kapsam:</strong> Bu rehber online sipariş verebildiğin baskılı tabela
            çözümlerini (dekota, folyo, branda) karşılaştırır. Işıklı kutu harf ve totem gibi
            projeli işler keşif gerektirir —{" "}
            <Link href="/teklif-al" className="font-semibold underline">
              teklif formundan
            </Link>{" "}
            ölçü göndererek fiyat alabilirsin.
          </div>
        </section>

        {/* Malzeme karşılaştırması — canlı başlangıç fiyatlarıyla */}
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">
            Malzeme karşılaştırması ve başlangıç fiyatları ({asOf})
          </h2>
          <div className="mt-5 space-y-4">
            {cards.map((c) => (
              <article key={c.categorySlug} className="p-5 bg-paper-50 border border-paper-200 rounded-xl">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-ink-900 text-lg">{c.name}</h3>
                  {c.minPrice > 0 && (
                    <span className="text-sm text-ink-700">
                      <span className="font-semibold text-ink-900 tabular-nums">
                        {formatPriceWithSymbol(c.minPrice)}
                      </span>
                      <span className="text-xs text-ink-500 ml-1">&apos;den başlayan</span>
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm text-ink-700 leading-relaxed">{c.desc}</p>
                <p className="mt-2 text-sm">
                  <span className="font-medium text-brand-700">İdeal kullanım:</span>{" "}
                  <span className="text-ink-700">{c.ideal}</span>
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {c.cheapest && (
                    <Link
                      href={`/urun/${c.cheapest.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-ink-900"
                    >
                      {c.cheapest.name} — fiyatını hesapla <ArrowRight size={11} weight="bold" />
                    </Link>
                  )}
                  <Link
                    href={`/kategori/${c.categorySlug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-ink-700 hover:text-ink-900 underline"
                  >
                    Tüm seçenekler
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Fiyatlar canlı katalogdan otomatik alınır; sipariş anında geçerli fiyat ürün sayfasındaki
            konfigüratörde görünen fiyattır.
          </p>
        </section>

        {/* Karar tablosu */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">Hızlı karar tablosu</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5">İhtiyaç</th>
                  <th className="px-3 py-2.5">Önerilen çözüm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-100">
                {[
                  { need: "Dükkan cephe tabelası (kalıcı)", sol: "Dekota levha tabela" },
                  { need: "Vitrin camına yazı/logo", sol: "Folyo kesim yazı" },
                  { need: "İnşaat/şantiye cephesi, büyük duyuru", sol: "Vinil branda (kuşgözlü)" },
                  { need: "Araç üzerine firma yazısı", sol: "Folyo kesim veya araç magneti" },
                  { need: "Geçici kampanya/etkinlik tabelası", sol: "Vinil branda veya dekota" },
                  { need: "Işıklı kutu harf / totem", sol: "Projeli iş — teklif al" },
                ].map((r) => (
                  <tr key={r.need} className="hover:bg-paper-50">
                    <td className="px-3 py-3 text-ink-700">{r.need}</td>
                    <td className="px-3 py-3 font-medium text-ink-900">{r.sol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SSS + FAQPage JSON-LD */}
        <GuideFaqSection items={faqs} url={PAGE_PATH} />

        {/* CTA */}
        <section className="mt-14 p-8 md:p-12 bg-ink-900 text-paper-50 rounded-2xl text-center">
          <Lightning size={28} weight="fill" className="text-brand-400 mx-auto mb-3" />
          <h2 className="text-2xl md:text-3xl font-semibold">Tabelanı şimdi yapılandır</h2>
          <p className="mt-3 text-paper-100/70 max-w-xl mx-auto">
            Malzemeyi seç, ebatı gir, fiyatı anında gör — {formatPriceWithSymbol(minStart)}&apos;den
            başlayan KDV dahil fiyatlarla. Tasarım desteği ücretsiz.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/kategori/dekota-baski"
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              Dekota Tabela Fiyatı Hesapla <ArrowRight size={14} weight="bold" />
            </Link>
            <Link
              href="/kategori/folyo"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Folyo Kesim
            </Link>
            <Link
              href="/teklif-al"
              className="px-6 py-3 border border-paper-100/30 text-paper-50 rounded-lg text-sm font-semibold hover:bg-white/5 inline-flex items-center gap-2"
            >
              Işıklı Tabela Teklifi Al
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
