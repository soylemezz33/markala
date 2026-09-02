import Link from "next/link";
import { Container } from "@markala/ui";
import { ArrowRight, Article, MapPin } from "@phosphor-icons/react/dist/ssr";
import { getBlogPosts } from "@/lib/blog";

/**
 * Rehberler bloğu (2026-09-02 SEO denetimi).
 *
 * NEDEN: denetimde sitenin EN ÇOK GÖSTERİM ALAN sayfalarının rehber ve blog yazıları
 * olduğu çıktı — /rehber/isg-zorunlu-uyari-levhalari 308 gösterim, /blog/topraklama-
 * isareti… 252 gösterim (anasayfanın kendisi 266). Buna karşılık ikisi de anasayfa
 * gövdesinden HİÇ bağlantı almıyordu; yalnız footer'da tek satırlık jenerik "Blog &
 * Rehberler" linki vardı. Trafiği getiren içerik, sitenin en güçlü sayfasından destek
 * görmüyordu.
 *
 * FİYAT REHBERLERİ ELLE LİSTELENDİ: bunlar kod tarafında sabit rotalar (sitemap'teki
 * STATIC_ROUTES ile aynı küme), DB'den gelmiyor. Blog yazıları ise API'den — en yeni
 * üçü gösterilir, yazı yoksa o sütun hiç render edilmez.
 *
 * ŞEHİR SAYFALARI DA BURADA: /matbaa hub'ı denetimde yalnız footer'dan link alıyordu,
 * oysa /matbaa/antalya (141 gös) ve /matbaa/gaziantep (103 gös) gerçek trafik alıyor.
 *
 * ── TASARIM DÜZENİ (2026-09-02, Hasan: "bu alanın tasarımını hiç sevmedim") ──
 * Önceki hâlde iki farklı içerik türü (fiyat rehberi + blog yazısı) HİÇBİR ayrım
 * olmadan alt alta iki satır hâlinde duruyordu: 6 birbirine benzeyen kutu. Üstelik
 * üst satırda başlık/özet kırpılmadığı, alt satırda kırpıldığı için kart boyları
 * tutmuyordu. Şimdi her iki grup kendi küçük başlığını taşıyor ve iki satırda da
 * aynı kırpma uygulanıyor → boylar eşit, gruplar okunur.
 */

/** Fiyat rehberleri — en çok arama alan üçü. Rota listesi sitemap ile aynı kaynaktan
 *  türetilmiyor bilerek: burada SIRALAMA (hangi üçü öne çıkacak) bir editör kararı. */
const FIYAT_REHBERLERI = [
  {
    href: "/rehber/isg-zorunlu-uyari-levhalari",
    baslik: "Zorunlu İSG uyarı levhaları",
    ozet: "Hangi levha yasal zorunluluk, hangi renk neyi anlatır?",
  },
  {
    href: "/rehber/kartvizit-fiyatlari-2026",
    baslik: "Kartvizit fiyatları 2026",
    ozet: "Adet, kâğıt ve selefon seçiminin maliyete etkisi.",
  },
  {
    href: "/rehber/branda-baski-m2-fiyati-2026",
    baslik: "Branda baskı m² fiyatı 2026",
    ozet: "Metrekare hesabı nasıl yapılır, gramaj ne değiştirir?",
  },
];

export async function GuidesRail() {
  // Blog API'si hata verirse blok yazısız değil, blogsuz görünür — rehberler yine durur.
  const yazilar = (await getBlogPosts()).slice(0, 3);

  return (
    <section className="bg-paper-100 py-14 md:py-20 border-t border-paper-200">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
              Bilgi Bankası
            </p>
            <h2 className="mt-1.5 text-3xl md:text-4xl font-serif text-ink-900">
              Sipariş öncesi işinize yarayacak rehberler
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:gap-2.5 transition-all"
          >
            Tüm yazılar <ArrowRight size={15} weight="bold" />
          </Link>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
          Fiyat ve mevzuat rehberleri
        </p>
        <div className="grid items-stretch gap-3 md:gap-4 md:grid-cols-3">
          {FIYAT_REHBERLERI.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="group flex h-full flex-col rounded-xl border border-paper-200 bg-paper-50 p-5 transition-all hover:border-ink-300 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2"
            >
              <Article size={20} weight="duotone" className="text-brand-700" />
              <h3 className="mt-3 font-semibold text-ink-900 group-hover:text-brand-700 transition-colors line-clamp-2">
                {r.baslik}
              </h3>
              <p className="mt-1.5 text-sm text-ink-500 leading-snug line-clamp-2">{r.ozet}</p>
              <span className="mt-auto pt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 group-hover:gap-2 transition-all">
                Rehberi oku <ArrowRight size={12} weight="bold" />
              </span>
            </Link>
          ))}
        </div>

        {yazilar.length > 0 && (
          <>
          <p className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
            Blogdan son yazılar
          </p>
          <ul className="grid items-stretch gap-3 md:gap-4 md:grid-cols-3">
            {yazilar.map((y) => (
              <li key={y.slug}>
                <Link
                  href={`/blog/${y.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-paper-200 bg-paper-50 p-5 transition-all hover:border-ink-300 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    Blog · {y.readingMinutes} dk okuma
                  </span>
                  <h3 className="mt-2 font-semibold text-ink-900 group-hover:text-brand-700 transition-colors line-clamp-2">
                    {y.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-ink-500 leading-snug line-clamp-2">
                    {y.excerpt}
                  </p>
                  <span className="mt-auto pt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 group-hover:gap-2 transition-all">
                    Yazıyı oku <ArrowRight size={12} weight="bold" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          </>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-paper-200 pt-5">
          <Link
            href="/matbaa"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:gap-2.5 transition-all"
          >
            <MapPin size={15} weight="bold" /> Şehrinizdeki matbaa hizmetimiz
          </Link>
          <Link
            href="/sozluk"
            className="text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors"
          >
            Matbaa sözlüğü
          </Link>
          <Link
            href="/blog"
            className="md:hidden text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors"
          >
            Tüm yazılar
          </Link>
        </div>
      </Container>
    </section>
  );
}
