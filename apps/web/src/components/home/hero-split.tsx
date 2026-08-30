import Link from "next/link";
import { Container } from "@markala/ui";
import { ArrowRight, ChatCircleText } from "@phosphor-icons/react/dist/ssr";
import type { Product } from "@markala/types";
import type { HeroBannerData } from "@/lib/catalog";
import { HeroVisual } from "@/components/home/hero-visual";

/**
 * Anasayfa hero (2026-08-31 yeniden düzeni) — solda GERÇEK METİN, sağda görsel.
 *
 * Neden değişti (docs: anasayfa ilk ekran kararı):
 *  - Eski hero 3840×1344 oranında, edge-to-edge saf görseldi. 1920px ekranda 672px +
 *    155px başlık = 827px, yani görünür alanın tamamı. İlk ekranda TEK BİR eylem çağrısı
 *    yoktu; fiyat çıpası ve butonları taşıyan HeroCtaBand fold'un altında kalıyordu.
 *  - Slaytların metni görsele gömülüydü: ne Google ne ekran okuyucu görüyordu; sayfadaki
 *    tek h1 `sr-only` ve jenerikti.
 *  - GA4 (60 gün): anasayfa 383 oturumla en çok inilen sayfa ama oturum başına 1,4 ₺
 *    üretiyor; kategori sayfaları 34,9 ₺. İlk ekranda katalog/fiyat girişi yok.
 *
 * Fiyat çıpası canlı katalogdan gelir; fiyatı yoksa o parça hiç basılmaz (uydurma yok).
 */
const ANCHOR_SLUG = "klasik-kartvizit";
const ANCHOR_LABEL = "Kartvizit";

function anchorPrice(p: Product | undefined): number {
  if (!p) return 0;
  const dp = (p as { displayPrice?: number | null }).displayPrice;
  if (typeof dp === "number" && dp > 0) return dp;
  return p.startingPrice && p.startingPrice > 0 ? p.startingPrice : 0;
}

export function HeroSplit({
  products,
  slides,
}: {
  products: Product[];
  slides: HeroBannerData[];
}) {
  const fiyat = anchorPrice(products.find((p) => p.slug === ANCHOR_SLUG));

  // Katalog boyutu GERÇEK sayıdan türetilir, elle yazılmaz: 50'nin altına yuvarlanır,
  // böylece ürün silinse bile iddia şişmez ("778 aktif ürün" → "750+").
  // ÖNEMLİ: h1'e GÖMÜLMEZ. API blip'inde getProducts() boş dönebiliyor; sayı başlığın
  // ortasındayken cümle "Kartvizitten brandaya  baskı ürünü" diye bozuluyordu (dev'de
  // yakalandı). Sayı alt satırda opsiyonel bir önek — yoksa cümle yine tam.
  const urunSayisi = Math.floor(products.length / 50) * 50;

  const gorselVar = slides.length > 0;

  return (
    <section className="bg-paper-50 border-b border-paper-200">
      <Container className="py-8 md:py-10 lg:py-12">
        <div
          className={
            gorselVar
              ? "grid gap-7 lg:grid-cols-[1.05fr_.95fr] lg:gap-10 lg:items-center"
              : "max-w-3xl"
          }
        >
          <div>
            {/* Sayfanın TEK h1'i — artık görünür gerçek metin (eski sr-only h1 kaldırıldı). */}
            <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-semibold leading-[1.12] tracking-tight text-ink-900 text-balance">
              Kartvizitten brandaya tüm baskı ürünleri
            </h1>
            <p className="mt-3 text-base md:text-lg text-ink-700 leading-relaxed max-w-xl">
              {urunSayisi > 0 ? `${urunSayisi}+ üründe ebadını` : "Ebadını"} seç, adedini gir —
              fiyatı anında gör. Tasarımın yoksa ücretsiz hazırlarız.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <Link
                href="/urunler"
                className="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2"
              >
                Ürünleri Keşfet <ArrowRight size={15} weight="bold" />
              </Link>
              <Link
                href="/teklif-al"
                className="inline-flex items-center justify-center gap-1.5 px-6 py-3 border border-ink-300 hover:border-ink-500 text-ink-900 rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2"
              >
                <ChatCircleText size={15} weight="bold" /> Ücretsiz Teklif Al
              </Link>
            </div>

            <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-700">
              {fiyat > 0 && (
                <li>
                  {ANCHOR_LABEL}{" "}
                  <strong className="font-semibold text-ink-900 tabular-nums">
                    {fiyat.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
                  </strong>
                  &apos;den
                </li>
              )}
              <li>
                <strong className="font-semibold text-ink-900">2-3 iş günü</strong> üretim
              </li>
              <li>
                <strong className="font-semibold text-ink-900">81 ile</strong> kargo
              </li>
              <li>
                <strong className="font-semibold text-ink-900">Ücretsiz</strong> tasarım desteği
              </li>
            </ul>
          </div>

          {gorselVar && <HeroVisual slides={slides} />}
        </div>
      </Container>
    </section>
  );
}
