import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  FrameCorners,
  CheckCircle,
  Info,
  ArrowRight,
  Ruler,
  Scissors,
  Truck,
} from "@phosphor-icons/react/dist/ssr";
import { getProductBySlug, getProducts } from "@/lib/catalog";
import { getDisplayPrice } from "@/lib/configurator";
import { formatPriceWithSymbol } from "@/lib/format";
import { BreadcrumbJsonLd, ArticleJsonLd } from "@/components/seo/json-ld";
import { GuideFaqSection, asOfLabel } from "../_shared";

// Fiyatlar canlı katalogdan SSR — saatte bir tazelenir (branda rehberiyle aynı desen).
export const revalidate = 3600;

const PAGE_PATH = "/rehber/pleksi-baski-fiyatlari-2026";
const BASLIK = "Pleksi Baskı Fiyatları 2026: m² Hesabı ve Kalınlık Seçimi";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Pleksi Baskı Fiyatları 2026 | m² Fiyatı, 3 mm ve 5 mm Farkı",
    description:
      "2026 güncel pleksi (akrilik) UV baskı m² fiyatları: 3 mm mi 5 mm mi, beyaz/siyah/şeffaf hangi işe uygun, CNC kesim ne kadar tutar ve örnek ebat hesap tablosu. KDV dahil.",
    alternates: { canonical: PAGE_PATH },
    openGraph: {
      type: "article",
      title: "Pleksi Baskı Fiyatları 2026 | m² Hesabı ve Kalınlık Seçimi",
      description:
        "Pleksi UV baskıda m² fiyatı nasıl hesaplanır? 3 mm / 5 mm farkı, renk seçimi, CNC kesim ve örnek hesaplar.",
      url: PAGE_PATH,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: BASLIK }],
    },
  };
}

/** Yaygın pleksi kullanım senaryoları (cm). Fiyat DAİMA canlı m² fiyatından hesaplanır. */
const ORNEK_EBATLAR = [
  { en: 30, boy: 20, kullanim: "Kapı isimliği, oda tabelası" },
  { en: 50, boy: 35, kullanim: "Yönlendirme levhası, menü panosu" },
  { en: 70, boy: 50, kullanim: "Resepsiyon logosu, bilgi panosu" },
  { en: 100, boy: 70, kullanim: "Mağaza içi kampanya panosu" },
  { en: 150, boy: 100, kullanim: "Fuar standı panosu, cephe tabelası" },
];

export default async function PleksiBaskiFiyatlariPage() {
  const pleksi = await getProductBySlug("pleksi-baski");
  // Ürün yoksa/fiyatsızsa THROW: ISR son başarılı sayfayı korur, uydurma fiyatlı
  // sayfa üretilmez (branda rehberindeki blip-koruma mantığının aynısı).
  if (!pleksi || getDisplayPrice(pleksi) <= 0) {
    throw new Error("rehber/pleksi: ürün bulunamadı veya fiyatsız döndü (API blip?), stale ISR korunur");
  }
  const m2Ham = pleksi.displayPrice ?? 0; // KDV dahil ham m² fiyatı (en ince kalınlık)
  const m2 = getDisplayPrice(pleksi);

  // Karşılaştırma bölümü: aynı işi gören diğer sert levhalar — canlı fiyatlarla.
  const tumUrunler = await getProducts();
  const levhalar = tumUrunler
    .filter((p) => ["dekota-baski-5mm", "kompozit-baski"].includes(p.slug) && getDisplayPrice(p) > 0)
    .sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));

  const asOf = asOfLabel();

  // Örnek hesap: alan (min 1 m²) × canlı m² fiyatı — motorun perM2 mantığıyla birebir aynı.
  const ornekler = ORNEK_EBATLAR.map((s) => {
    const alan = (s.en * s.boy) / 10000;
    return { ...s, alan, tahmini: Math.ceil(Math.max(1, alan) * m2Ham) };
  });
  const ellibesOtuzbes = ornekler.find((e) => e.en === 50 && e.boy === 35);

  const faqs = [
    {
      q: "Pleksi baskı m² fiyatı nasıl hesaplanır?",
      a: `Pleksi serbest ölçüyle üretilir: en × boy ölçüsünden alan (m²) bulunur ve seçtiğin kalınlığın m² birim fiyatıyla çarpılır. ${asOf} itibarıyla 3 mm pleksi ${formatPriceWithSymbol(m2)}/m² (KDV dahil) fiyattan başlar. Hesaplama minimum 1 m² üzerinden yapılır, 0,2 m²'lik küçük bir isimlik de 1 m² fiyatıyla hesaplanır, çünkü kesim ve tezgâh hazırlığı ebattan bağımsız sabit maliyettir.`,
    },
    {
      q: "3 mm mi 5 mm mi seçmeliyim?",
      a: "3 mm çoğu iç mekan uygulaması için yeterlidir: isimlik, yönlendirme levhası, menü panosu, resepsiyon logosu. Fiyat/performans dengesi en iyi olan kalınlık budur. 5 mm'yi 50 cm'den büyük panolarda, tek noktadan asılacak işlerde veya prestijli görünüm istenen resepsiyon/ödül uygulamalarında tercih et, kalınlık arttıkça levha kendi ağırlığıyla esneme yapmaz ve kenar kalınlığı daha sağlam bir izlenim verir.",
    },
    {
      q: "Beyaz, siyah ve şeffaf pleksi arasındaki fark ne?",
      a: "Şeffaf pleksi cam görünümündedir; arkasındaki duvar görünür, bu yüzden logo ve yazıların havada duruyor izlenimi verdiği kurumsal resepsiyon uygulamalarında kullanılır. Beyaz pleksi opaktır ve baskı renklerini en canlı gösterir, fotoğraf ve renkli tasarımlar için en doğru zemin budur. Siyah pleksi ise beyaz/açık renk yazılarla yüksek kontrast verir, premium bir görünüm sağlar. Üç renkte de m² fiyatı aynıdır, seçim tamamen görünüme göre yapılır.",
    },
    {
      q: "CNC kesim ne kadar tutar, ne zaman gerekir?",
      a: "Dikdörtgen dışında bir form istiyorsan (logo silueti, oval, yuvarlak köşe, harf kesimi) CNC kesim gerekir ve m² üzerinden ek ücretlendirilir. Standart dikdörtgen kesimde ek ücret yoktur. Montaj için delik açılması da CNC ile yapılır. Kesin tutarı ürün sayfasında CNC seçeneğini işaretleyince anında görürsün.",
    },
    {
      q: "Pleksi mi dekota mı kompozit mi?",
      a: "Pleksi cam görünümlü, parlak ve prestijli bir malzemedir; iç mekanda öne çıkan işlerde kullanılır ve üçü içinde en pahalısıdır. Dekota (foreks) sert PVC köpüktür, hafif ve ekonomiktir, geçici pano, stant ve iç mekan yönlendirmede idealdir. Kompozit iki alüminyum tabaka arasında öz bulunan levhadır; dış mekana en dayanıklı olanıdır, bina cephesi ve kalıcı tabelada tercih edilir. Kısaca: görünüm önemliyse pleksi, bütçe önemliyse dekota, dış mekan dayanımı önemliyse kompozit.",
    },
    {
      q: "Pleksi dış mekanda kullanılabilir mi?",
      a: "Kullanılabilir ancak ideal değildir. Akrilik UV ışığına karşı dekotadan dayanıklıdır fakat sürekli güneş ve sıcaklık değişimi altında zamanla esneme yapabilir. Kalıcı dış mekan tabelası için kompozit levha daha doğru tercihtir. Korunaklı bir giriş, saçak altı veya vitrin içi gibi yarı açık alanlarda pleksi sorunsuz kullanılır.",
    },
    {
      q: "Fiyatlara KDV dahil mi?",
      a: "Evet. Bu sayfadaki ve ürün sayfasındaki tüm m² fiyatları KDV dahildir ve sepette değişmez. Teklif karşılaştırırken diğer firmaların fiyatlarının KDV dahil olup olmadığını kontrol etmeni öneririz, sektörde ikisi de kullanılıyor.",
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Anasayfa", href: "/" },
          { name: "Pleksi Baskı Fiyatları 2026", href: PAGE_PATH },
        ]}
      />
      <ArticleJsonLd
        title={BASLIK}
        description="Pleksi UV baskıda m² fiyatının hesaplanma mantığı, kalınlık ve renk seçimi, CNC kesim ve örnek ebat hesapları."
        url={PAGE_PATH}
        datePublished="2026-08-28"
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
            Pleksi baskı fiyatları 2026: m² hesabı ve kalınlık seçimi
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Pleksi (akrilik) levhaya doğrudan UV baskı yapılır ve m² üzerinden fiyatlanır.{" "}
            {asOf} itibarıyla 3 mm pleksi{" "}
            <strong className="text-ink-900">{formatPriceWithSymbol(m2)}/m²</strong>&apos;den
            başlar, KDV dahil, sepette değişmez.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/15 text-success rounded-full font-medium">
              <CheckCircle size={13} weight="fill" /> KDV dahil, sepette değişmez
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-900 rounded-full font-medium">
              <Ruler size={13} weight="fill" /> cm bazında serbest ölçü
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-200 text-ink-900 rounded-full font-medium">
              <Scissors size={13} weight="fill" /> CNC ile özel form
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-10 md:py-14 max-w-4xl">
        {/* m² mantığı */}
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">m² fiyatı nasıl oluşur: 3 adım</h2>
          <ol className="mt-5 space-y-3 text-sm text-ink-700">
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Alanı bul:</strong> en × boy (metre cinsinden).
                70×50 cm bir pano = 0,35 m². Hesaplama minimum 1 m² üzerinden yapılır.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Kalınlığı seç:</strong> 3 mm ve 5 mm arasında m²
                birim fiyatı değişir. Renk (beyaz, siyah, şeffaf) fiyatı{" "}
                <strong className="text-ink-900">değiştirmez</strong>, yalnız görünümü belirler.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Ek işlemleri ekle:</strong> dikdörtgen dışı bir
                form istiyorsan CNC kesim m² üzerinden eklenir. Kesin fiyat ürün sayfasında ölçünü
                girdiğinde anında görünür.
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
            3 mm pleksi, standart dikdörtgen kesim, KDV dahil yaklaşık toplam.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-200 text-left text-ink-500">
                  <th className="py-2.5 pr-4 font-medium">Ebat</th>
                  <th className="py-2.5 pr-4 font-medium">Alan</th>
                  <th className="py-2.5 pr-4 font-medium">Tipik kullanım</th>
                  <th className="py-2.5 font-medium text-right">Yaklaşık</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200/70">
                {ornekler.map((e) => (
                  <tr key={`${e.en}x${e.boy}`}>
                    <td className="py-2.5 pr-4 font-medium text-ink-900 whitespace-nowrap">
                      {e.en} × {e.boy} cm
                    </td>
                    <td className="py-2.5 pr-4 text-ink-700 whitespace-nowrap tabular-nums">
                      {e.alan.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} m²
                      {e.alan < 1 && <span className="text-ink-500"> → 1 m²</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-700">{e.kullanim}</td>
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
              Tablodaki tutarlar 3 mm kalınlık ve dikdörtgen kesim içindir. 5 mm veya CNC kesim
              seçilirse fiyat artar. 1 m²&apos;nin altındaki ebatlar 1 m² üzerinden faturalanır,
              tabloda bu ok işaretiyle gösterilmiştir.
            </span>
          </p>
        </section>

        {/* Kalınlık ve renk seçimi */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">Hangi kalınlık, hangi renk?</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-paper-200 bg-paper-50 p-5">
              <h3 className="font-semibold text-ink-900">3 mm: çoğu iş için doğru seçim</h3>
              <p className="mt-2 text-sm text-ink-700">
                İsimlik, oda tabelası, yönlendirme levhası, menü panosu ve 50 cm&apos;e kadar
                panolarda 3 mm yeterlidir. Fiyat/performans dengesi en iyi kalınlık budur.
              </p>
            </div>
            <div className="rounded-lg border border-paper-200 bg-paper-50 p-5">
              <h3 className="font-semibold text-ink-900">5 mm: büyük ve prestijli işlerde</h3>
              <p className="mt-2 text-sm text-ink-700">
                50 cm üzeri panolarda, tek noktadan asılacak işlerde ve resepsiyon/ödül gibi
                görünümün öne çıktığı uygulamalarda. Esneme yapmaz, kenar kalınlığı sağlam durur.
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-paper-200 bg-paper-100/60 p-5">
            <h3 className="font-semibold text-ink-900">Renk fiyatı değiştirmez</h3>
            <p className="mt-2 text-sm text-ink-700">
              <strong>Şeffaf</strong> cam görünümü verir, logo havada duruyor izlenimi yaratır.{" "}
              <strong>Beyaz</strong> baskı renklerini en canlı gösterir, fotoğraf ve renkli
              tasarımlar için doğru zemindir. <strong>Siyah</strong> açık renk yazılarla yüksek
              kontrast ve premium görünüm sağlar. Üçünün de m² fiyatı aynıdır.
            </p>
          </div>
        </section>

        {/* Karşılaştırma — iç bağlantılarla */}
        {levhalar.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-semibold text-ink-900">
              Pleksi mi, dekota mı, kompozit mi?
            </h2>
            <p className="mt-2 text-sm text-ink-500">
              Üçü de sert levhaya baskıdır ama farklı işler için. Fiyatlar {asOf} itibarıyla, KDV
              dahil m² başlangıç değerleridir.
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-paper-200 text-left text-ink-500">
                    <th className="py-2.5 pr-4 font-medium">Malzeme</th>
                    <th className="py-2.5 pr-4 font-medium">Ne zaman</th>
                    <th className="py-2.5 font-medium text-right">m² başlangıç</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-200/70">
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-ink-900">Pleksi</td>
                    <td className="py-2.5 pr-4 text-ink-700">
                      Görünümün öne çıktığı iç mekan işleri
                    </td>
                    <td className="py-2.5 text-right font-semibold text-ink-900 tabular-nums whitespace-nowrap">
                      {formatPriceWithSymbol(m2)}
                    </td>
                  </tr>
                  {levhalar.map((p) => (
                    <tr key={p.slug}>
                      <td className="py-2.5 pr-4 font-medium text-ink-900">
                        <Link href={`/urun/${p.slug}`} className="hover:text-brand-700 underline underline-offset-2">
                          {p.slug === "kompozit-baski" ? "Kompozit" : "Dekota / Foreks"}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-ink-700">
                        {p.slug === "kompozit-baski"
                          ? "Kalıcı dış mekan tabelası, bina cephesi"
                          : "Ekonomik pano, stant, iç mekan yönlendirme"}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-ink-900 tabular-nums whitespace-nowrap">
                        {formatPriceWithSymbol(getDisplayPrice(p))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <GuideFaqSection items={faqs} url={PAGE_PATH} />

        {/* CTA */}
        <section className="mt-14 rounded-xl border border-paper-200 bg-paper-50 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink-900">Ölçünü gir, fiyatı anında gör</h2>
          <p className="mt-2 text-sm text-ink-700 max-w-2xl">
            Pleksi baskı ürün sayfasında en ve boyu cm cinsinden yazdığında kalınlık, renk ve CNC
            kesim seçimine göre KDV dahil fiyat anında hesaplanır. Teklif beklemene gerek yok.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/urun/pleksi-baski"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-brand-500 text-ink-900 text-sm font-bold hover:bg-brand-400 transition-colors"
            >
              Pleksi baskı fiyatı hesapla <ArrowRight size={15} weight="bold" />
            </Link>
            <Link
              href="/rehber/branda-baski-m2-fiyati-2026"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-paper-200 text-sm font-semibold text-ink-900 hover:bg-paper-100 transition-colors"
            >
              Branda m² fiyat rehberi
            </Link>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-500">
            <Truck size={13} weight="fill" /> Türkiye geneli kargo · 1.500 ₺ üzeri ücretsiz
          </p>
        </section>
      </Container>
    </>
  );
}
