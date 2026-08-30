import { Question, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { FAQPageJsonLd } from "@/components/seo/json-ld";

/**
 * Rehber (/rehber/*) sayfaları için ortak parçalar.
 * Görsel dil MEVCUT desenlerden alınmıştır (ürün sayfası SSS bloğu) — yeni stil icat edilmez.
 */

export interface GuideFaqItem {
  q: string;
  a: string;
}

/**
 * SSS bölümü + FAQPage JSON-LD (tek kaynaktan — görünen metin ile şema birebir aynı).
 * Ürün sayfasındaki details/summary deseniyle aynı sınıflar.
 */
export function GuideFaqSection({ items, url }: { items: GuideFaqItem[]; url: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-14">
      <FAQPageJsonLd questions={items} url={url} />
      <header className="flex items-center gap-2 mb-5">
        <Question size={22} weight="fill" className="text-brand-700" />
        <h2 className="text-2xl font-semibold text-ink-900">Sık Sorulan Sorular</h2>
      </header>
      <div className="space-y-3 max-w-3xl">
        {items.map((f, i) => (
          <details
            key={i}
            className="group bg-paper-50 border border-paper-200 rounded-lg overflow-hidden open:shadow-sm"
          >
            <summary className="cursor-pointer px-4 py-3 font-medium text-ink-900 text-sm flex items-center justify-between hover:bg-paper-100 transition-colors">
              <span>{f.q}</span>
              <CaretRight
                size={14}
                weight="bold"
                className="transition-transform group-open:rotate-90 text-ink-500"
              />
            </summary>
            <div className="px-4 pb-4 pt-3 text-sm text-ink-700 leading-relaxed border-t border-paper-200/50 bg-paper-100/30">
              <span>{f.a}</span>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

/**
 * HIZLI CEVAP bloğu (2026-08-30, AEO/GEO): sayfanın en üstünde, soruya 2-3 cümlede
 * kesin cevap veren kutu.
 *
 * Neden: yapay zeka asistanları (ChatGPT/Perplexity/AI Overviews) ve Google'ın öne çıkan
 * snippet'i, uzun rehberlerin tamamını değil "tek paragrafta cevap" bloklarını alıntılar.
 * Uzun içerik SEO için değerli ama alıntılanabilirlik için kısa özet şart — ikisini birlikte
 * sunuyoruz. Metin, sayfadaki verinin AYNISI olmalı (uydurma/eskiyen rakam yazma).
 */
export function HizliCevap({ soru, cevap }: { soru: string; cevap: string }) {
  return (
    <section
      aria-label="Kısa cevap"
      className="mt-6 rounded-xl border border-brand-200 bg-brand-50/60 px-5 py-4"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
        Kısa cevap
      </p>
      <p className="mt-1.5 text-base font-medium text-ink-900 leading-relaxed">{soru}</p>
      <p className="mt-1 text-sm text-ink-700 leading-relaxed">{cevap}</p>
    </section>
  );
}

/**
 * Dürüst tarihleme etiketi — "Temmuz 2026" gibi. Sayfa ISR ile her yeniden üretildiğinde
 * (revalidate 3600) güncel ay/yıl yazılır; fiyatlar da aynı üretimde canlı katalogdan çekildiği
 * için etiket ile veri hep aynı tazeliktedir.
 */
export function asOfLabel(): string {
  return new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(new Date());
}
