import Link from "next/link";
import { Container } from "@markala/ui";
import { ArrowRight, Lightbulb } from "@phosphor-icons/react/dist/ssr";
import { KARGO_SURESI, URETIM_SURESI } from "@/lib/delivery";

/**
 * Anasayfa açıklama metni (2026-09-01 SEO denetimi, Hasan onayı).
 *
 * NEDEN: Denetimde anasayfanın 1.036 kelimelik görünür metninin neredeyse tamamının ürün
 * adı + fiyat olduğu çıktı — Markala'nın ne yaptığını anlatan TEK açıklayıcı paragraf
 * yoktu. Sonuç: sayfa "matbaa", "kartvizit", "dijital baskı" gibi terimlerde 1.-2. sıraya
 * çıkabiliyor ama Google onu neredeyse hiç göstermiyordu; title'daki ana terim
 * "online matbaa"da 28 günde SIFIR gösterim vardı. Google'ın tutunacağı metin yok.
 *
 * KONUM: sayfanın EN ALTI (Hasan: "aşağılarda kalsın"). Satın alma akışının önüne
 * geçmiyor; ürün rafları, süreç ve sektör bölümleri yukarıda aynen duruyor.
 *
 * H3'LER SORU CEVAPLAR: her alt başlık tek bir gerçek soruya karşılık gelir. Bu hem
 * taranabilirliği artırır hem de pasaj bazlı alıntılamayı (AI Overviews / ChatGPT arama)
 * kolaylaştırır — tek bir duvar metni bunu yapamaz.
 *
 * İÇ BAĞLANTILAR KASITLI: denetimde /matbaa, /kategoriler, /hizmetler, /numune-talebi
 * gibi sayfaların anasayfa gövdesinden HİÇ link almadığı, yalnız footer'da kaldığı
 * çıkmıştı. Buradaki bağlantılar o boşluğu kapatır — süs değil, gövde içi iç link.
 *
 * ── TASARIM DÜZENİ (2026-09-02, Hasan: "bu alanın tasarımını hiç sevmedim") ──
 * Önceki hâlde 9 iç bağlantı CÜMLELERİN ORTASINA gömülüydü. Turuncu kalın linkler
 * her iki satırda bir okumayı kesiyor, blok reklam panosu gibi duruyordu. Metin ve
 * bağlantı AYRILDI: düzyazı kesintisiz okunur, bağlantılar altta taranabilir bir
 * listeye iner. SEO değeri aynen korunur — aynı sayfalara aynı çapa metinleriyle
 * link veriliyor, üstelik liste hâlinde daha görünür.
 */

/** Her sütun: bir soru + kesintisiz cevap + o cevabın işaret ettiği sayfalar. */
const BOLUMLER = [
  {
    no: "01",
    baslik: "Ne basıyoruz?",
    metin:
      "Katalog 45 kategoriye ayrılıyor. Matbaa tarafında kartvizit, antetli kâğıt, zarf, broşür, el ilanı, cepli dosya ve makbuz; geniş format tarafında vinil branda, afiş, folyo, dekota ve roll-up; promosyonda kupa, magnet, plaket ve madalya var. İş güvenliği levhaları kendi başına bir bölüm: uyarı, yasaklayıcı, emredici/KKD, yangın, elektrik ve GES levhalarını mevzuatın istediği ebat ve renklerde üretiyoruz.",
    baglantilar: [
      { href: "/kategoriler", metin: "45 kategorinin tamamı" },
      { href: "/kategori/is-guvenligi-uyari-ikaz", metin: "İş güvenliği levhaları" },
    ],
  },
  {
    no: "02",
    baslik: "Fiyatı ne zaman görüyorum?",
    metin:
      "Teklif beklemeden, sipariş vermeden. Her üründe ebat, malzeme ve adedi seçtiğiniz bir yapılandırıcı var; tutar siz seçtikçe güncelleniyor ve KDV dahil gösteriliyor. Baskıya hazır dosyanız yoksa tasarımı biz hazırlıyoruz; kâğıdı ve baskı kalitesini önce elinizde görmek isterseniz numune gönderiyoruz.",
    baglantilar: [
      { href: "/fiyat-listesi", metin: "Sık sorulan işlerin fiyat listesi" },
      { href: "/hizmetler/tasarim-destegi", metin: "Ücretsiz tasarım desteği" },
      { href: "/numune-talebi", metin: "Ücretsiz numune kutusu" },
    ],
  },
  {
    no: "03",
    baslik: "Nerede üretiliyor, nereye gidiyor?",
    metin: `Üretim Mersin'deki atölyemizde yapılıyor, sevkiyat DHL ve Aras Kargo ile Türkiye'nin 81 iline gidiyor. Standart işlerde üretim ${URETIM_SURESI}, kargo ${KARGO_SURESI} sürüyor. Düzenli ve yüksek adetli alımlarda ayrı fiyatlandırma uyguluyoruz.`,
    baglantilar: [
      { href: "/matbaa", metin: "81 ilin teslimat detayları" },
      { href: "/kurumsal", metin: "Kurumsal hesap ve toplu alım" },
    ],
  },
];

export function AboutMarkala() {
  return (
    <section className="bg-paper-100 py-14 md:py-20 border-t border-paper-200">
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
            Markala Hakkında
          </p>
          <h2 className="mt-1.5 text-3xl md:text-4xl font-serif text-ink-900">
            Online matbaa nasıl çalışır?
          </h2>
          <p className="mt-4 text-lg text-ink-700 leading-relaxed">
            Markala, 324 Ajans çatısı altında çalışan online matbaadır. Kartvizitten
            brandaya, promosyon ürününden iş güvenliği levhasına 750&#39;den fazla ürünü;
            matbaaya gitmeden, telefonda fiyat sormadan sipariş edebileceğiniz tek bir
            katalogda topluyoruz.
          </p>
        </div>

        {/* items-stretch + h-full: sütunlar metin uzunluğundan bağımsız EŞİT yükseklikte;
            bağlantı listesi mt-auto ile hep kartın dibine oturur (önceki hâlde sütunlar
            farklı boylardaydı ve alt hizalama tutmuyordu). */}
        <div className="mt-10 grid items-stretch gap-4 md:gap-5 md:grid-cols-3">
          {BOLUMLER.map((b) => (
            <article
              key={b.no}
              className="flex h-full flex-col rounded-2xl border border-paper-200 bg-paper-50 p-6 md:p-7"
            >
              <span
                aria-hidden
                className="font-serif text-2xl leading-none text-brand-500"
              >
                {b.no}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-ink-900">{b.baslik}</h3>
              <p className="mt-2.5 text-[15px] text-ink-700 leading-relaxed">{b.metin}</p>

              {/* mt-auto: liste kartın DİBİNE oturur → sütunlar farklı metin uzunluğunda
                  olsa bile bağlantı satırları aynı hizada başlar. pt-6 asgari boşluğu
                  garanti eder (kısa metinde liste başlığa yapışmasın). */}
              <div className="mt-auto pt-6">
                <ul className="space-y-1.5 border-t border-paper-200 pt-4">
                {b.baglantilar.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="group inline-flex items-start gap-1.5 text-sm font-medium text-brand-700 hover:text-ink-900 transition-colors"
                    >
                      <ArrowRight
                        size={14}
                        weight="bold"
                        className="mt-[3px] shrink-0 transition-transform group-hover:translate-x-0.5"
                      />
                      <span className="underline decoration-brand-500/30 underline-offset-4 group-hover:decoration-ink-900/40">
                        {l.metin}
                      </span>
                    </Link>
                  </li>
                ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        {/* Kapanış ipucu — gövdeden ayrı bir şerit. Önceki hâlde sıradan bir paragraftı
            ve gözden kaçıyordu; oysa "en sık gecikme sebebimiz" diyen bir uyarı. */}
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-brand-500/25 bg-brand-50/50 p-5">
          <Lightbulb size={20} weight="fill" className="mt-0.5 shrink-0 text-brand-700" />
          <p className="text-[15px] text-ink-700 leading-relaxed">
            Dosyanızı göndermeden önce{" "}
            <Link
              href="/yardim/tasarim-ve-dosya/baskiya-hazir-dosya-nasil-hazirlanir"
              className="font-medium text-brand-700 underline decoration-brand-500/40 underline-offset-4 hover:text-ink-900"
            >
              baskıya hazır dosya rehberine
            </Link>{" "}
            göz atın — taşma payı, çözünürlük ve renk profili hataları en sık gecikme
            sebebimiz.
          </p>
        </div>
      </Container>
    </section>
  );
}
