import Link from "next/link";
import { Container } from "@markala/ui";

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
 */
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

        <div className="mt-10 grid gap-8 md:gap-10 md:grid-cols-3 max-w-5xl">
          <div>
            <h3 className="text-lg font-semibold text-ink-900">Ne basıyoruz?</h3>
            <p className="mt-2.5 text-ink-700 leading-relaxed">
              Katalog{" "}
              <Link href="/kategoriler" className="text-brand-700 font-medium hover:underline">
                45 kategoriye
              </Link>{" "}
              ayrılıyor. Matbaa tarafında kartvizit, antetli kağıt, zarf, broşür, el ilanı,
              cepli dosya ve makbuz; geniş format tarafında vinil branda, afiş, folyo,
              dekota ve roll-up; promosyonda kupa, magnet, plaket ve madalya var.{" "}
              <Link
                href="/kategori/is-guvenligi-uyari-ikaz"
                className="text-brand-700 font-medium hover:underline"
              >
                İş güvenliği levhaları
              </Link>{" "}
              kendi başına bir bölüm: uyarı, yasaklayıcı, emredici/KKD, yangın, elektrik ve
              GES levhalarını mevzuatın istediği ebat ve renklerde üretiyoruz.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-ink-900">Fiyatı ne zaman görüyorum?</h3>
            <p className="mt-2.5 text-ink-700 leading-relaxed">
              Teklif beklemeden, sipariş vermeden. Her üründe ebat, malzeme ve adedi
              seçtiğiniz bir yapılandırıcı var; tutar siz seçtikçe güncelleniyor ve KDV
              dahil gösteriliyor. Sık sorulan işlerin fiyatlarını{" "}
              <Link href="/fiyat-listesi" className="text-brand-700 font-medium hover:underline">
                fiyat listesinden
              </Link>{" "}
              topluca da görebilirsiniz. Baskıya hazır dosyanız yoksa{" "}
              <Link
                href="/hizmetler/tasarim-destegi"
                className="text-brand-700 font-medium hover:underline"
              >
                ücretsiz tasarım desteği
              </Link>{" "}
              veriyoruz; kağıdı ve baskı kalitesini önce elinizde görmek isterseniz{" "}
              <Link href="/numune-talebi" className="text-brand-700 font-medium hover:underline">
                ücretsiz numune kutusu
              </Link>{" "}
              gönderiyoruz.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-ink-900">Nerede üretiliyor, nereye gidiyor?</h3>
            <p className="mt-2.5 text-ink-700 leading-relaxed">
              Üretim Mersin&#39;deki atölyemizde yapılıyor, sevkiyat DHL ve Aras Kargo ile
              Türkiye&#39;nin 81 iline gidiyor. Standart işlerde üretim 2-3 iş günü, kargo
              2-4 iş günü sürüyor.{" "}
              <Link href="/matbaa" className="text-brand-700 font-medium hover:underline">
                Şehir sayfalarımızda
              </Link>{" "}
              Mersin, Adana, Antalya, Gaziantep ve diğer illere özel teslimat detayları
              var. Düzenli ve yüksek adetli alımlar için{" "}
              <Link href="/kurumsal" className="text-brand-700 font-medium hover:underline">
                kurumsal hesap
              </Link>{" "}
              açıp ayrı fiyatlandırma alabilirsiniz.
            </p>
          </div>
        </div>

        <p className="mt-9 text-sm text-ink-500 max-w-3xl">
          Dosyanızı göndermeden önce{" "}
          <Link
            href="/yardim/tasarim-ve-dosya/baskiya-hazir-dosya-nasil-hazirlanir"
            className="text-brand-700 font-medium hover:underline"
          >
            baskıya hazır dosya rehberine
          </Link>{" "}
          göz atın — taşma payı, çözünürlük ve renk profili hataları en sık gecikme
          sebebimiz.
        </p>
      </Container>
    </section>
  );
}
