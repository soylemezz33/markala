"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@markala/ui";
import { ProductImageFallback } from "@/components/product/product-image-fallback";

/**
 * Ürün galerisi.
 *
 * 2026-08-26 (Hasan: "fotoğraflar arası geçiş yok, yavaş geldi"):
 * Eski davranışta TEK bir <Image> vardı ve küçük resme tıklayınca `src` değişiyordu.
 * Tarayıcı yeni (büyük) varyantı indirene kadar kutu BOŞ kalıyor, sonra görsel birden
 * beliriyordu — yani hem geçiş efekti yoktu hem de her tıklama bir ağ beklemesiydi
 * (galerinin 2./3. görseli genelde hiçbir önbellekte olmadığı için 0,2-0,8 sn).
 *
 * Yeni davranış:
 * 1. Görseller üst üste yığılır; yalnız görünen olanın opacity'si 1 → yumuşak çapraz geçiş.
 * 2. Yeni görsel İNENE KADAR eskisi ekranda kalır (boş kutu/zıplama yok).
 * 3. Küçük resme dokunma/üzerine gelme anında o görsel indirilmeye başlar (ön-yükleme).
 * 4. Sayfa yerleştikten sonra boşta kalan görseller de sessizce indirilir → tıklama anında
 *    geçiş. Veri tasarrufu açık ya da 2G bağlantıda bu adım atlanır.
 * LCP davranışı korunur: yalnız ilk görsel `priority`.
 */
export function Gallery({ images, alt, fallbackSrc }: { images: string[]; alt: string; fallbackSrc?: string }) {
  const [active, setActive] = useState(0);
  /** Ekranda GÖSTERİLEN görsel — hedef görsel inene kadar öncekinde kalır. */
  const [visible, setVisible] = useState(0);
  /** İndirmesi tamamlanmış görseller. */
  const [loaded, setLoaded] = useState<Set<number>>(new Set());
  /** Yüklenemeyen (404/ağ hatası) görseller. */
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());
  /** İndirmesi BAŞLATILMIŞ görseller: ilk görsel + ön-yüklenenler. */
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0]));

  const hasImages = images.length > 0;

  function markBroken(index: number) {
    setBrokenImages((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
  }
  /** Görseli DOM'a ekleyerek indirmesini başlatır (hover/dokunma/boşta ön-yükleme). */
  function prefetch(index: number) {
    setMounted((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
  }

  // Hedef görsel hazır olunca (ya da bozuksa) ekranı ona çevir.
  useEffect(() => {
    if (loaded.has(active) || brokenImages.has(active)) setVisible(active);
  }, [active, loaded, brokenImages]);

  // Sayfa yerleştikten sonra kalan görselleri sessizce indir — tıklama anında geçiş için.
  useEffect(() => {
    if (images.length < 2) return;
    const conn = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
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
  }, [images]);

  const showFallback = !hasImages || brokenImages.has(visible);
  const waiting = active !== visible;

  return (
    <div className="lg:mx-auto lg:w-[clamp(320px,48vh,460px)]">
      {/* Kutu HER ZAMAN KARE. Masaüstünde eskiden yalnız YÜKSEKLİK sabitti
          (lg:h-[min(48vh,460px)]) ama genişlik sütunu dolduruyordu → 563x460'lık
          dikdörtgen kutuya 1080x1080 kare görsel object-cover ile oturunca üstten ve
          alttan %18'i kırpılıyordu (2026-08-28, Hasan ekran görüntüsü). Artık genişlik
          de aynı ölçüye clamp'lenir; yükseklik sınırı (fiyat+CTA scroll'suz görünsün,
          2026-08-07) böylece korunur, kırpma biter. mx-auto: küçük resimler de
          büyük görselle aynı hizada kalsın diye sarmalayıcıya uygulanır. */}
      <div className="relative aspect-square bg-paper-100 rounded-lg overflow-hidden">
        {hasImages
          ? images.map((src, i) =>
              mounted.has(i) && !brokenImages.has(i) ? (
                <Image
                  key={src + i}
                  src={src}
                  // Yalnız görünen görsel ekran okuyucuya metin verir; diğerleri dekoratif kopya.
                  alt={i === visible ? alt : ""}
                  aria-hidden={i !== visible}
                  fill
                  priority={i === 0}
                  loading={i === 0 ? undefined : "eager"}
                  sizes="(min-width:1024px) 460px, 100vw"
                  className={cn(
                    // contain: kare olmayan bir görsel yüklenirse de HİÇBİR ŞEY kırpılmaz;
                    // kare görselde kare kutuda cover ile birebir aynı sonucu verir.
                    "object-contain transition-opacity duration-300 ease-out",
                    i === visible ? "opacity-100" : "opacity-0",
                  )}
                  onLoad={() => setLoaded((prev) => (prev.has(i) ? prev : new Set(prev).add(i)))}
                  onError={() => markBroken(i)}
                />
              ) : null,
            )
          : null}

        {showFallback &&
          (fallbackSrc && !hasImages ? (
            <Image
              src={fallbackSrc}
              alt={alt}
              fill
              priority
              sizes="(min-width:1024px) 460px, 100vw"
              className="object-contain"
              unoptimized
            />
          ) : (
            <ProductImageFallback name={alt} />
          ))}

        {/* Görsel inerken üstte ince ilerleme şeridi — "tıkladım, bir şey oluyor" geri bildirimi. */}
        {waiting && (
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-0.5 bg-brand-500/70 animate-pulse"
          />
        )}
      </div>

      {hasImages && images.length > 1 && (
        <div className="mt-2.5 grid grid-cols-6 lg:grid-cols-7 gap-2">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => {
                prefetch(i);
                setActive(i);
              }}
              // Tıklamadan ÖNCE indirmeyi başlat: masaüstünde hover, mobilde dokunma anı.
              onMouseEnter={() => prefetch(i)}
              onFocus={() => prefetch(i)}
              onTouchStart={() => prefetch(i)}
              aria-label={`${alt} — görsel ${i + 1}`}
              aria-pressed={i === active}
              className={cn(
                "relative aspect-square bg-paper-100 rounded-md overflow-hidden border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-1",
                i === active
                  ? "border-ink-900 ring-2 ring-ink-900/10"
                  : "border-paper-200 hover:border-ink-300",
              )}
            >
              {brokenImages.has(i) ? (
                <ProductImageFallback />
              ) : (
                <Image
                  src={src}
                  alt={`${alt} — görsel ${i + 1}`}
                  fill
                  loading="lazy"
                  sizes="100px"
                  className="object-contain"
                  onError={() => markBroken(i)}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
