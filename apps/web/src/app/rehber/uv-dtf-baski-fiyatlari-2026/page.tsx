import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@markala/ui";
import {
  FrameCorners,
  CheckCircle,
  Info,
  ArrowRight,
  Ruler,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { getProductBySlug } from "@/lib/catalog";
import { getDisplayPrice } from "@/lib/configurator";
import { formatPriceWithSymbol } from "@/lib/format";
import { BreadcrumbJsonLd, ArticleJsonLd } from "@/components/seo/json-ld";
import { GuideFaqSection, asOfLabel } from "../_shared";

export const revalidate = 3600;

const PAGE_PATH = "/rehber/uv-dtf-baski-fiyatlari-2026";
const BASLIK = "UV DTF Baskı Fiyatları 2026: Nedir, Nereye Yapışır, m² Kaç TL?";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "UV DTF Baskı Fiyatları 2026 | Nedir ve m² Fiyatı Ne Kadar?",
    description:
      "UV DTF transfer sticker nedir, cam-metal-ahşap-plastik hangi yüzeye yapışır, folyodan farkı nedir? 2026 güncel m² fiyatları ve metraja göre kademeli fiyatlandırma. KDV dahil.",
    alternates: { canonical: PAGE_PATH },
    openGraph: {
      type: "article",
      title: "UV DTF Baskı Fiyatları 2026 | Nedir, m² Kaç TL?",
      description:
        "UV DTF transfer sticker: uygulama yüzeyleri, folyodan farkı, metraja göre kademeli m² fiyatları.",
      url: PAGE_PATH,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: BASLIK }],
    },
  };
}

export default async function UvDtfFiyatlariPage() {
  const [dtf, folyo] = await Promise.all([
    getProductBySlug("uv-dtf-baski"),
    getProductBySlug("folyo-cesitleri"),
  ]);
  if (!dtf || getDisplayPrice(dtf) <= 0) {
    throw new Error("rehber/uv-dtf: ürün fiyatsız/boş döndü (API blip?), stale ISR korunur");
  }
  const m2Ham = dtf.displayPrice ?? 0;
  const m2 = getDisplayPrice(dtf);
  const folyoM2 = folyo ? getDisplayPrice(folyo) : 0;
  const asOf = asOfLabel();

  const ORNEK = [
    { en: 30, boy: 30, kullanim: "Kapı/vitrin logosu, tek parça sticker" },
    { en: 50, boy: 50, kullanim: "Araç kapısı logo takımı" },
    { en: 100, boy: 70, kullanim: "Cam kapı giydirme" },
    { en: 200, boy: 100, kullanim: "Toplu sticker üretimi (çoklu dizim)" },
  ].map((s) => {
    const alan = (s.en * s.boy) / 10000;
    return { ...s, alan, tahmini: Math.ceil(Math.max(1, alan) * m2Ham) };
  });

  const faqs = [
    {
      q: "UV DTF baskı nedir?",
      a: "UV DTF (Direct to Film), baskının doğrudan yüzeye değil özel bir transfer filmin üzerine yapıldığı tekniktir. Baskı UV mürekkeple film üzerine basılır, üzerine yapıştırıcı katman eklenir ve ikinci bir film ile kapatılır. Uygulama sırasında üst film kaldırılır, tasarım yüzeye yapışır. Isı, pres veya özel makine gerektirmez, elle uygulanır.",
    },
    {
      q: "Hangi yüzeylere yapışır?",
      a: "Cam, metal, ahşap, sert plastik, seramik, deri ve boyalı yüzeylerin çoğuna yapışır. Düz veya hafif kavisli yüzeylerde sorunsuz çalışır. Kumaş ve esnek yüzeyler için uygun değildir, orada tekstil DTF kullanılır. Çok pürüzlü, tozlu veya yağlı yüzeylerde tutunma zayıflar; uygulama öncesi yüzeyin temiz ve kuru olması gerekir.",
    },
    {
      q: "Folyodan farkı ne, hangisini seçmeliyim?",
      a: `Folyo tek katmanlı yapışkanlı bir malzemedir ve kesim gerektirir; çok parçalı tasarımlarda her parçanın ayrı hizalanması gerekir. UV DTF'te tasarım tek transfer üzerinde bütün hâlinde gelir, kesim yoktur ve mürekkep kabartma dokusu verir, dokununca hissedilir. Küçük, detaylı ve çok renkli işlerde UV DTF daha pratik; geniş alan giydirmelerinde folyo daha ekonomiktir.${folyoM2 > 0 ? ` Karşılaştırma için: folyo ${formatPriceWithSymbol(folyoM2)}/m², UV DTF ${formatPriceWithSymbol(m2)}/m²'den başlar.` : ""}`,
    },
    {
      q: "Neden metraja göre fiyat değişiyor?",
      a: `UV DTF'te makine hazırlığı ve film sarfiyatı işin başında sabit bir maliyet oluşturur; toplam metraj arttıkça bu maliyet daha çok alana yayılır ve birim fiyat düşer. Bu yüzden fiyat 0-2 m, 2-5 m, 5-20 m ve 20 m üzeri olmak üzere dört kademede tutulur. ${asOf} itibarıyla en yüksek kademe ile en düşük kademe arasında m² başına belirgin fark vardır, çok sayıda küçük sticker'ı tek siparişte toplamak bu yüzden avantajlıdır.`,
    },
    {
      q: "Ne kadar dayanır?",
      a: "İç mekanda yıllarca sorunsuz kalır. Dış mekanda UV mürekkep solmaya karşı dirençlidir; doğrudan güneş alan yüzeylerde ortalama 2-3 yıl canlılığını korur. Sürekli su teması olan yüzeylerde (bulaşık makinesi, dış cephe alt kotu) ömrü kısalır.",
    },
    {
      q: "Sökülünce iz bırakır mı?",
      a: "Sökülebilir ancak kalıcı yapışkanlıdır; sökerken parça parça gelir ve yüzeyde yapışkan kalıntısı bırakabilir. Kalıntı, izopropil alkol veya yapışkan sökücü ile temizlenir. Sık değiştirilecek uygulamalar için tekrar sökülebilir folyo daha uygundur.",
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
          { name: "UV DTF Baskı Fiyatları 2026", href: PAGE_PATH },
        ]}
      />
      <ArticleJsonLd
        title={BASLIK}
        description="UV DTF transfer sticker nedir, hangi yüzeylere yapışır, folyodan farkı ve metraja göre m² fiyatları."
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
            UV DTF baskı fiyatları 2026: nedir, nereye yapışır?
          </h1>
          <p className="mt-4 text-lg text-ink-700">
            Baskı transfer filme yapılır, cam-metal-ahşap fark etmeden neredeyse her yüzeye elle
            uygulanır. {asOf} itibarıyla{" "}
            <strong className="text-ink-900">{formatPriceWithSymbol(m2)}/m²</strong>&apos;den
            başlar, KDV dahil.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/15 text-success rounded-full font-medium">
              <CheckCircle size={13} weight="fill" /> Kesim gerektirmez
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-900 rounded-full font-medium">
              <Sparkle size={13} weight="fill" /> kabartma dokulu
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-200 text-ink-900 rounded-full font-medium">
              <Ruler size={13} weight="fill" /> metraja göre kademeli fiyat
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-10 md:py-14 max-w-4xl">
        <section>
          <h2 className="text-2xl font-semibold text-ink-900">Nasıl çalışır: 3 adım</h2>
          <ol className="mt-5 space-y-3 text-sm text-ink-700">
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Baskı filme yapılır:</strong> tasarım UV mürekkeple
                transfer filmin üzerine basılır, üzerine yapışkan katman eklenir.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Yüzeye bastırılır:</strong> temiz ve kuru yüzeye
                yerleştirilip elle bastırılır. Isı veya pres gerekmez.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle size={16} weight="fill" className="text-success shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-900">Üst film kaldırılır:</strong> tasarım yüzeyde
                kalır. Çok parçalı işlerde bile hizalama sorunu olmaz, hepsi tek transferde gelir.
              </span>
            </li>
          </ol>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">Metraja göre kademeli fiyat</h2>
          <p className="mt-3 text-sm text-ink-700 max-w-3xl">
            Makine hazırlığı ve film sarfiyatı işin başında sabit maliyet oluşturur. Toplam metraj
            arttıkça bu maliyet daha geniş alana yayılır ve m² birim fiyatı düşer. Bu yüzden
            fiyatlandırma dört kademede tutulur:
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {["0 – 2 metre", "2 – 5 metre", "5 – 20 metre", "20 metre ve üzeri"].map((k, i) => (
              <div
                key={k}
                className={`rounded-lg border p-4 ${i === 3 ? "border-success/40 bg-success/5" : "border-paper-200 bg-paper-50"}`}
              >
                <div className="text-sm font-semibold text-ink-900">{k}</div>
                <div className="mt-1 text-xs text-ink-500">
                  {i === 3 ? "en avantajlı birim fiyat" : i === 0 ? "az metrajlı işler" : "ara kademe"}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 flex gap-2 text-xs text-ink-500">
            <Info size={14} weight="fill" className="shrink-0 mt-0.5 text-brand-700" />
            <span>
              Çok sayıda küçük sticker&apos;ı ayrı ayrı değil <strong>tek siparişte</strong>{" "}
              toplamak birim fiyatı düşürür. Kademeni ürün sayfasında seçtiğinde fiyat anında
              güncellenir.
            </span>
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-ink-900">
            Örnek hesap tablosu ({asOf} itibarıyla)
          </h2>
          <p className="mt-2 text-sm text-ink-500">İlk kademe fiyatıyla yaklaşık toplam, KDV dahil.</p>
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
                {ORNEK.map((e) => (
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
        </section>

        <GuideFaqSection items={faqs} url={PAGE_PATH} />

        <section className="mt-14 rounded-xl border border-paper-200 bg-paper-50 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-ink-900">Ölçünü gir, fiyatı anında gör</h2>
          <p className="mt-2 text-sm text-ink-700 max-w-2xl">
            Ürün sayfasında ölçünü ve metraj kademeni seçtiğinde KDV dahil fiyat anında hesaplanır.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/urun/uv-dtf-baski"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-brand-500 text-ink-900 text-sm font-bold hover:bg-brand-400 transition-colors"
            >
              UV DTF fiyatı hesapla <ArrowRight size={15} weight="bold" />
            </Link>
            <Link
              href="/rehber/folyo-baski-fiyatlari-2026"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-paper-200 text-sm font-semibold text-ink-900 hover:bg-paper-100 transition-colors"
            >
              Folyo baskı rehberi
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
