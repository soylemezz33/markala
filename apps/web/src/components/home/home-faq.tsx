import Link from "next/link";
import { Container } from "@markala/ui";
import { CaretDown, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getFaqs, anasayfaSorulari } from "@/lib/faqs";
import { FAQPageJsonLd } from "@/components/seo/json-ld";

/**
 * Anasayfa SSS (2026-09-01 SEO denetimi, Hasan onayı).
 *
 * SORULAR ELLE YAZILMADI: admin "SSS Yönetimi"nden gelir (lib/faqs.ts). Anasayfada
 * uydurma cevap durmaması ve panelde bir cevap düzeltilince buranın da deploy'suz
 * düzelmesi için. Soru yoksa bölüm hiç render edilmez.
 *
 * ŞEMA HAKKINDA DÜRÜST NOT: FAQPage artık Google'da ticari sitelere zengin sonuç
 * ÜRETMİYOR (Ağustos 2023 kısıtlaması; HowTo'yu bu sayfadan aynı gerekçeyle kaldırmıştık).
 * Yine de basıyoruz, çünkü ChatGPT/Perplexity/AI Overviews tarafında soru-cevap
 * pasajlarının alıntılanmasını kolaylaştırıyor — robots.ts'teki açık AI bot daveti ve
 * llms.txt ile aynı amaca hizmet eder. Beklenti "yıldızlı sonuç" değil, alıntılanabilirlik.
 *
 * <details>/<summary> KULLANILDI: JS'siz çalışır, ekran okuyucu doğru okur ve —SEO açısından
 * kritik olan— kapalı haldeki cevap metni HTML'de tam olarak durur, Google onu görür.
 */
export async function HomeFaq() {
  const sorular = anasayfaSorulari(await getFaqs());
  if (sorular.length === 0) return null;

  return (
    <section className="bg-paper-50 py-14 md:py-20 border-t border-paper-200">
      {/* Görünen metin ile şema TEK kaynaktan — Google'ın "gizli içerik" saydığı
          uyuşmazlık riski yok; ikisi de aynı `sorular` dizisinden çıkıyor. */}
      <FAQPageJsonLd questions={sorular.map((f) => ({ q: f.question, a: f.answer }))} url="/" />

      <Container>
        <div className="max-w-3xl">
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
            Sıkça Sorulanlar
          </p>
          <h2 className="mt-1.5 text-3xl md:text-4xl font-serif text-ink-900">
            Sipariş vermeden önce
          </h2>
        </div>

        <div className="mt-8 max-w-3xl divide-y divide-paper-200 border-y border-paper-200">
          {sorular.map((f) => (
            <details key={f.id} className="group">
              <summary className="flex cursor-pointer items-start justify-between gap-4 py-4 list-none [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2">
                <h3 className="text-base md:text-lg font-semibold text-ink-900">{f.question}</h3>
                <CaretDown
                  size={18}
                  weight="bold"
                  aria-hidden="true"
                  className="mt-1 flex-none text-ink-500 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="pb-5 pr-8 text-ink-700 leading-relaxed">{f.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href="/yardim/sss"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:gap-2.5 transition-all"
          >
            Tüm soruları gör <ArrowRight size={15} weight="bold" />
          </Link>
          <Link
            href="/yardim"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors"
          >
            Yardım merkezi
          </Link>
        </div>
      </Container>
    </section>
  );
}
