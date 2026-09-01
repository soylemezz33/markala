"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@markala/ui";
import { ProductImageFallback } from "@/components/product/product-image-fallback";
import { GalleryLightbox } from "@/components/product/gallery-lightbox";
import type { ResolvedImage } from "@/lib/product-image";

/**
 * Ürün galerisi (AJA-386 çoklu görsel).
 *
 * Girdi ARTIK URL dizisi değil, `resolveProductImage` çıktısı `ResolvedImage[]` — her görsel
 * kendi `id/alt/width/height/blurDataURL`'ini taşır. Böylece:
 *  - CLS=0: kutu `aspect-square`, görseller `fill` + doğru `sizes` → yükleme zıplaması yok.
 *  - Erişilebilirlik: yalnız GÖRÜNEN görsel ekran okuyucuya metin verir, kopyalar dekoratif.
 *  - Varyant senkronu: konfigüratör `markala:gorsel-sec` olayında `imageId` (yeni) veya
 *    `index` (eski) gönderir; galeri ona geçer, eşleşme yoksa cover'da kalır.
 *
 * Yerleşim:
 *  - Masaüstü (lg+): SOLDA dikey thumbnail şeridi (aktif = amber #F5B800 çerçeve) + sağda
 *    ana görsel (yumuşak çapraz geçiş). Ana görsele tıklama → lightbox (zoom).
 *  - Mobil: yatay `scroll-snap` şerit + altında nokta göstergesi. Dokunma → lightbox.
 *
 * LCP: yalnız cover `priority` + `fetchPriority=high` + eager; gerisi `lazy`.
 */
export function Gallery({ images }: { images: ResolvedImage[] }) {
  const [active, setActive] = useState(0);
  /** Masaüstü çapraz geçiş: hedef görsel inene kadar öncekinde kal (boş kutu yok). */
  const [visible, setVisible] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(new Set([0]));
  /** Yüklenemeyen görseller için onError zincirinde ilerlemiş src override'ı. */
  const [srcOverride, setSrcOverride] = useState<Record<number, string>>({});
  /** Hepten bozuk (fallback de yüklenemedi) → "görsel yok" durumu. */
  const [dead, setDead] = useState<Set<number>>(new Set());
  /** İndirmesi başlatılmış görseller (cover + ön-yüklenenler). */
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0]));
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const count = images.length;
  const safeActive = Math.min(active, Math.max(0, count - 1));

  const prefetch = useCallback((i: number) => {
    setMounted((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
  }, []);

  const goTo = useCallback(
    (i: number) => {
      if (i < 0 || i >= count) return;
      prefetch(i);
      setActive(i);
    },
    [count, prefetch],
  );

  // Hedef görsel hazır/bozuk olunca masaüstü görünürü ona çevir.
  useEffect(() => {
    if (loaded.has(safeActive) || dead.has(safeActive)) setVisible(safeActive);
  }, [safeActive, loaded, dead]);

  // Konfigüratör varyant senkronu — imageId (yeni kontrat) veya index (eski, 1-tabanlı çevrilmiş).
  useEffect(() => {
    function onSec(e: Event) {
      const detail = (e as CustomEvent<{ index?: number; imageId?: string }>).detail;
      let idx = -1;
      if (detail?.imageId) idx = images.findIndex((g) => g.id === detail.imageId);
      if (idx < 0 && typeof detail?.index === "number") idx = detail.index;
      if (Number.isInteger(idx) && idx >= 0 && idx < count) {
        goTo(idx);
        // Mobilde ilgili slayta kaydır.
        const el = scrollerRef.current?.children[idx] as HTMLElement | undefined;
        el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
    window.addEventListener("markala:gorsel-sec", onSec);
    return () => window.removeEventListener("markala:gorsel-sec", onSec);
  }, [images, count, goTo]);

  // Sayfa yerleştikten sonra kalan görselleri boşta indir (tıklama anında geçiş). 2G/veri
  // tasarrufunda atlanır.
  useEffect(() => {
    if (count < 2) return;
    const conn = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "")) return;
    const run = () => setMounted(new Set(images.map((_, i) => i)));
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(run, { timeout: 3000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(run, 1500);
    return () => window.clearTimeout(id);
  }, [images, count]);

  // Mobil scroll-snap: kaydırma bitince aktif noktayı güncelle.
  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active && i >= 0 && i < count) setActive(i);
  }, [active, count]);

  function handleError(i: number, product: ResolvedImage) {
    setSrcOverride((prev) => {
      // Zaten fallback (kategori/mockup) src'sindeyken de patlarsa → ölü işaretle.
      if (prev[i] || product.fallback) {
        setDead((d) => new Set(d).add(i));
        return prev;
      }
      // Gerçek foto patladı → jenerik mockup'a düş (kategori fallback resolver'da; burada
      // ürün bağlamı yok, güvenli jenerik mockup id'siyle aynı görsel adını korur).
      return { ...prev, [i]: `/api/mockup?slug=${encodeURIComponent(product.id)}&w=1200&h=1200` };
    });
  }

  function srcOf(i: number): string {
    return srcOverride[i] ?? images[i]?.src ?? "";
  }

  if (count === 0) {
    return (
      <div className="relative aspect-square bg-paper-100 rounded-lg overflow-hidden">
        <ProductImageFallback />
      </div>
    );
  }

  const activeImg = images[safeActive]!;

  return (
    <>
      {/* ===== MASAÜSTÜ (lg+): dikey thumbnail şeridi + ana görsel ===== */}
      <div className="hidden lg:flex lg:gap-3 lg:mx-auto lg:w-[clamp(360px,52vh,520px)] lg:max-w-full">
        {count > 1 && (
          <div
            className="flex flex-col gap-2 w-[64px] shrink-0 max-h-[520px] overflow-y-auto"
            role="tablist"
            aria-label="Ürün görselleri"
          >
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                role="tab"
                aria-selected={i === safeActive}
                aria-label={`Görsel ${i + 1}: ${img.alt}`}
                onClick={() => goTo(i)}
                onMouseEnter={() => prefetch(i)}
                onFocus={() => prefetch(i)}
                className={cn(
                  "relative aspect-square rounded-md overflow-hidden border-2 bg-paper-100 transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-1",
                  i === safeActive
                    ? "border-brand-500 ring-2 ring-brand-500/30" // aktif = amber #F5B800
                    : "border-paper-200 hover:border-ink-300",
                )}
              >
                {dead.has(i) ? (
                  <ProductImageFallback />
                ) : (
                  <Image
                    src={srcOf(i)}
                    alt=""
                    fill
                    loading="lazy"
                    sizes="64px"
                    className="object-contain"
                    onError={() => handleError(i, img)}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Görseli büyüt"
            className="group relative block w-full aspect-square bg-paper-100 rounded-lg overflow-hidden cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900"
          >
            {images.map((img, i) =>
              mounted.has(i) && !dead.has(i) ? (
                <Image
                  key={img.id}
                  src={srcOf(i)}
                  alt={i === visible ? img.alt : ""}
                  aria-hidden={i !== visible}
                  fill
                  priority={i === 0}
                  fetchPriority={i === 0 ? "high" : undefined}
                  loading={i === 0 ? undefined : "eager"}
                  sizes="(min-width:1024px) 520px, 100vw"
                  placeholder={img.blurDataURL ? "blur" : undefined}
                  blurDataURL={img.blurDataURL}
                  className={cn(
                    "object-contain transition-opacity duration-300 ease-out",
                    i === visible ? "opacity-100" : "opacity-0",
                  )}
                  onLoad={() => setLoaded((prev) => (prev.has(i) ? prev : new Set(prev).add(i)))}
                  onError={() => handleError(i, img)}
                />
              ) : null,
            )}
            {dead.has(safeActive) && <ProductImageFallback name={activeImg.alt} />}
            {/* Zoom ipucu — hover'da beliren rozet. */}
            <span className="absolute bottom-2 right-2 rounded-md bg-ink-900/70 px-2 py-1 text-[11px] font-medium text-paper-50 opacity-0 transition-opacity group-hover:opacity-100">
              Büyütmek için tıkla
            </span>
          </button>
        </div>
      </div>

      {/* ===== MOBİL (<lg): scroll-snap şerit + nokta göstergesi ===== */}
      <div className="lg:hidden">
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide rounded-lg bg-paper-100"
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={`Görsel ${i + 1}: ${img.alt}. Büyütmek için dokun`}
              className="relative w-full shrink-0 snap-center aspect-square"
            >
              {dead.has(i) ? (
                <ProductImageFallback name={img.alt} />
              ) : (
                <Image
                  src={srcOf(i)}
                  alt={i === 0 ? img.alt : `${img.alt}`}
                  fill
                  priority={i === 0}
                  fetchPriority={i === 0 ? "high" : undefined}
                  loading={i === 0 ? undefined : "lazy"}
                  sizes="100vw"
                  placeholder={img.blurDataURL ? "blur" : undefined}
                  blurDataURL={img.blurDataURL}
                  className="object-contain"
                  onError={() => handleError(i, img)}
                />
              )}
            </button>
          ))}
        </div>

        {count > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden>
            {images.map((img, i) => (
              <span
                key={img.id}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === safeActive ? "w-5 bg-brand-500" : "w-1.5 bg-ink-300",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <GalleryLightbox
          images={images}
          srcOverride={srcOverride}
          initialIndex={safeActive}
          onIndexChange={goTo}
          onClose={() => setLightboxOpen(false)}
          onError={handleError}
          deadSet={dead}
        />
      )}
    </>
  );
}
