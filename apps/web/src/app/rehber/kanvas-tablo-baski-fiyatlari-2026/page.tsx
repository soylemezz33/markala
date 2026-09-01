import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  FrameCorners,
  CheckCircle,
  Info,
  ArrowRight,
  Ruler,
  ImageSquare,
} from "@phosphor-icons/react/dist/ssr";
import { getProductBySlug } from "@/lib/catalog";
import { getDisplayPrice } from "@/lib/configurator";
import { formatPriceWithSymbol } from "@/lib/format";
import { BreadcrumbJsonLd, ArticleJsonLd } from "@/components/seo/json-ld";
import { GuideFaqSection, asOfLabel } from "../_shared";

export const revalidate = 3600;

const PAGE_PATH = "/rehber/kanvas-tablo-baski-fiyatlari-2026";
const BASLIK = "Kanvas Tablo Baskı Fiyatları 2026: Ebat Seçimi ve Fotoğraf Kalitesi";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Kanvas Tablo Baskı Fiyatları 2026 | m² Fiyatı ve Ebat Rehberi",
    description:
      "Kanvas (tuval) tablo baskı fiyatları 2026: hangi ebat nereye uyar, fotoğrafın kaç piksel olmalı, solvent mi UV mi? Popüler ebat fiyat tablosu, KDV dahil.",
    alternates: { canonical: PAGE_PATH },
    openGraph: {
      type: "article",
      title: "Kanvas Tablo Baskı Fiyatları 2026 | Ebat ve Kalite Rehberi",
      description:
        "Tuval baskıda ebat seçimi, fotoğraf çözünürlüğü ve m² fiyat hesabı.",
      url: PAGE_PATH,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: BASLIK }],
    },
  };
}

/** Popüler kanvas ebatları (cm) + gereken minimum piksel (100 dpi ≈ 39,4 px/cm). */
const EBATLAR = [
  { en: 30, boy: 40, nere: "Koridor, çalışma masası üstü", oran: "3:4 dikey" },
  { en: 50, boy: 70, nere: "Yatak odası, tek başına duvar", oran: "5:7 dikey" },
  { en: 70, boy: 50, nere: "Kanepe üstü, yatay manzara", oran: "7:5 yatay" },
  { en: 100, boy: 70, nere: "Salon odak duvarı", oran: "10:7 yatay" },
  { en: 150, boy: 100, nere: "Geniş salon, ofis lobisi", oran: "3:2 yatay" },
];

export default async function KanvasTabloFiyatlariPage() {
  const [kanvas, duvar] = await Promise.all([
    getProductBySlug("kanvas-tablo-baski"),
    getProductBySlug("duvar-kagidi-baski"),
  ]);
  if (!kanvas || getDisplayPrice(kanvas) <= 0) {
    throw new Error("rehber/kanvas: ürün fiyatsız/boş döndü (API blip?), stale ISR korunur");
  }
  const m2Ham = kanvas.displayPrice ?? 0;
  const m2 = getDisplayPrice(kanvas);
  const duvarM2 = duvar ? getDisplayPrice(duvar) : 0;
  const asOf = asOfLabel();

  const ornekler = EBATLAR.map((e) => {
    const alan = (e.en * e.boy) / 10000;
    // 100 dpi ≈ 39,37 piksel/cm — kanvas için yeterli çözünürlük eşiği.
    const pxEn = Math.round(e.en * 39.37);
    const pxBoy = Math.round(e.boy * 39.37);
    return { ...e, alan, pxEn, pxBoy, tahmini: Math.ceil(Math.max(1, alan) * m2Ham) };
  });

  const faqs = [
    {
      q: "Kanvas tablo baskı m² fiyatı ne kadar?",
      a: `${asOf} itibarıyla solvent baskıda m² ${formatPriceWithSymbol(m2)} (KDV dahil). Fiyat alan üzerinden hesaplanır: en × boy metre cinsinden çarpılır. Hesaplama minimum 1 m² üzerinden yapılır, 30×40 cm gibi küçük bir tablo da 1 m² fiyatıyla hesaplanır, çünkü baskı hazırlığı ebattan bağımsız sabit maliyettir. Bu yüzden küçük tabloları tek tek değil, birkaçını aynı siparişte toplamak daha avantajlıdır.`,
    },
    {
      q: "Fotoğrafım yeterli kalitede mi?",
      a: "Kanvas dokulu bir yüzeydir ve dokusu ince detayı bir miktar yumuşatır, bu yüzden fotoğraf baskısı kadar yüksek çözünürlük gerekmez. Gerçek boyutunda 100 dpi yeterlidir. Pratik ölçüt: santimetre × 40 = gereken piksel. 70×50 cm bir tablo için yaklaşık 2.800 × 2.000 piksel gerekir, bu, günümüzdeki çoğu telefon fotoğrafının üzerindedir. Aşağıdaki tabloda her ebat için gereken piksel yazılıdır.",
    },
    {
      q: "Şase (çıta) dahil mi?",
      a: "Hayır. Fiyatlar baskılı tuvalin kendisi içindir; ahşap şaseye gerdirme ayrı bir işçiliktir. Tuvali gerdirmeden de çerçeveletebilir veya kendi şasene gerdirebilirsin. Şaseli teslim istiyorsan sipariş öncesi bize yaz, ölçüne göre ayrıca fiyatlandıralım.",
    },
    {
      q: "Solvent baskı mı UV baskı mı?",
      a: "Solvent baskı ekonomiktir ve çoğu iş için yeterlidir. UV baskı renkleri daha canlı verir ve kokusuzdur, yatak odası, çocuk odası gibi kapalı alanlara asılacak tablolarda ve renk canlılığının öne çıktığı fotoğraflarda tercih edilir. İkisinin de m² fiyatı ürün sayfasında yan yana görünür.",
    },
    {
      q: "Hangi ebadı seçmeliyim?",
      a: "Pratik kural: tablo, asılacağı mobilyanın (kanepe, konsol, yatak başı) genişliğinin yaklaşık üçte ikisi kadar olmalı. 200 cm bir kanepenin üstüne 130-150 cm genişliğinde bir tablo oturur. Tek başına duran boş bir duvarda ise duvar genişliğinin yarısı iyi bir başlangıçtır. Dikey fotoğrafları dikey, manzaraları yatay ebatta bastır, fotoğrafın oranını değiştirmek kenarlardan kesilmesine yol açar.",
    },
    {
      q: "Tuval mi duvar kağıdı mı?",
      a: `İkisi farklı işler. Kanvas tablo taşınabilir, çerçeve gibi asılır ve tek bir görseli öne çıkarır. Duvar kağıdı duvarın tamamını kaplar ve mekânın atmosferini değiştirir.${duvarM2 > 0 ? ` m² fiyatı olarak kanvas ${formatPriceWithSymbol(m2)}, duvar kağıdı ${formatPriceWithSymbol(duvarM2)}'den başlar.` : ""} Tek bir odak görsel istiyorsan kanvas, tüm duvarı dönüştürmek istiyorsan duvar kağıdı.`,
    },
    {
      q: "Fiyatlara KDV dahil mi?",
      a: "Evet. Bu sayfadaki ve ürün sayfasındaki tüm m² fiyatları KDV dahildir, sepette değişmez.",
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Kanvas Tablo Baskı Fiyatları 2026", href: PAGE_PATH },
        ]}
      />
      <ArticleJsonLd
        title={BASLIK}
        description="Kanvas tablo baskıda ebat seçimi, gereken fotoğraf çözünürlüğü, solvent/UV farkı ve m² fiyat hesabı."
        url={PAGE_PATH}
        datePublished="2026-08-28"
      />

      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <FrameCorners size={20} weight="fill" className="text-brand-700" />
            <span className="text-sm font-semibold text-brand-700 uppercase tracking-wider">
              Fiyat Rehberi
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
            Kanvas tablo baskı fiyatları 2026: ebat ve kalite rehberi
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Fotoğrafın tuval kumaşa basılır, dokusu hissedilen mat bir yüzey verir. {asOf}{" "}
            itibarıyla <strong className="text-ink-900">{formatPriceWithSymbol(m2)}/m²</strong>
            &apos;den başlar, KDV dahil.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/15 text-success rounded-full font-medium">
              <CheckCircle size={13} weight="fill" /> KDV dahil
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-900 rounded-full font-medium">
              <Ruler size={13} weight="fill" /> serbest ölçü
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-200 text-ink-900 rounded-full font-medium">
              <ImageSquare size={13} weight="fill" /> telefon fotoğrafı yeterli
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-10 md:py-14 max-w-4xl">
        {/* Ebat + piksel tablosu — bu sayfanın asıl değeri */}
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">
            Popüler ebatlar, fiyat ve gereken piksel
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            Solvent baskı, KDV dahil yaklaşık toplam ({asOf} itibarıyla). Piksel değerleri 100 dpi
            eşiğine göredir.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-ink-500">
                  <th className="py-2.5 pr-4 font-medium">Ebat</th>
                  <th className="py-2.5 pr-4 font-medium">Nereye uyar</th>
                  <th className="py-2.5 pr-4 font-medium">Gereken piksel</th>
                  <th className="py-2.5 font-medium text-right">Yaklaşık</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200/70">
                {ornekler.map((e) => (
                  <tr key={`${e.en}x${e.boy}`}>
                    <td className="py-2.5 pr-4 font-medium text-ink-900 whitespace-nowrap">
                      {e.en} × {e.boy} cm
                      <span className="block text-xs font-normal text-ink-500">{e.oran}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-ink-700">{e.nere}</td>
                    <td className="py-2.5 pr-4 text-ink-700 whitespace-nowrap tabular-nums">
                      {e.pxEn.toLocaleString("tr-TR")} × {e.pxBoy.toLocaleString("tr-TR")}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-ink-900 tabular-nums whitespace-nowrap">
                      {formatPriceWithSymbol(e.tahmini)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 flex gap-2 text-xs text-ink-500">
            <Info size={14} weight="fill" className="shrink-0 mt-0.5 text-brand-700" />
            <span>
              1 m²&apos;nin altındaki ebatlar 1 m² üzerinden faturalanır. Küçük tabloları tek tek
              değil, birkaçını aynı siparişte toplamak daha avantajlıdır.
            </span>
          </p>
        </section>

        {/* Ebat seçimi kuralı */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">Hangi ebadı seçmeli?</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-paper-200 bg-paper-50 p-5">
              <h3 className="font-semibold text-ink-900">Mobilya üstüne asacaksan</h3>
              <p className="mt-2 text-sm text-ink-700">
                Tablo, altındaki mobilyanın genişliğinin yaklaşık <strong>üçte ikisi</strong> kadar
                olmalı. 200 cm kanepenin üstüne 130-150 cm genişliğinde bir tablo oturur.
              </p>
            </div>
            <div className="rounded-lg border border-paper-200 bg-paper-50 p-5">
              <h3 className="font-semibold text-ink-900">Boş duvara asacaksan</h3>
              <p className="mt-2 text-sm text-ink-700">
                Duvar genişliğinin <strong>yarısı</strong> iyi bir başlangıçtır. Göz hizası merkez
                alınır: tablonun ortası yerden yaklaşık 145-150 cm yükseklikte olmalı.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-ink-700">
            Fotoğrafın oranını koru: dikey fotoğrafı dikey, manzarayı yatay ebatta bastır. Oranı
            değiştirmek görselin kenarlardan kesilmesine yol açar.
          </p>
        </section>

        <GuideFaqSection items={faqs} url={PAGE_PATH} />

        <section className="mt-14 rounded-xl border border-paper-200 bg-paper-50 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink-900">Ölçünü gir, fiyatı anında gör</h2>
          <p className="mt-2 text-sm text-ink-700 max-w-2xl">
            Ürün sayfasında en ve boyu cm cinsinden yazdığında KDV dahil fiyat anında hesaplanır.
            Fotoğrafını yüklediğinde grafik ekibimiz çözünürlüğünü baskıdan önce ücretsiz kontrol
            eder.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/urun/kanvas-tablo-baski"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-brand-500 text-ink-900 text-sm font-bold hover:bg-brand-400 transition-colors"
            >
              Kanvas tablo fiyatı hesapla <ArrowRight size={15} weight="bold" />
            </Link>
            <Link
              href="/rehber/duvar-kagidi-baski-fiyatlari-2026"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-paper-200 text-sm font-semibold text-ink-900 hover:bg-paper-100 transition-colors"
            >
              Duvar kağıdı rehberi
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
