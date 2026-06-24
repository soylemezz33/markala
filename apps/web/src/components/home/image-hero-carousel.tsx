"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Container, cn } from "@markala/ui";

/**
 * Tam-genişlik banner carousel — admin "Anasayfa Slider"dan yönetilen, metni gömülü hazır
 * görseller (1525×540 ≈ 2.82:1) olduğu gibi gösterilir; tüm banner ctaHref'e tıklanabilir.
 * Yapısal/3D hero'dan farkı: burada görsel = tasarımın kendisi (overlay metin YOK).
 */
export interface HeroBanner {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string | null;
  ctaHref?: string | null;
  title: string;
}

const AUTOPLAY_MS = 6000;

export function ImageHeroCarousel({ slides }: { slides: HeroBanner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // İlk slide (LCP adayı) dışındaki slide'ları ilk boyamadan sonra mount et. Hepsi
  // absolute inset-0 + opacity:0 olduğu için IntersectionObserver "görünür" sayıp
  // eager yükler ve LCP görseliyle bant genişliği için yarışır (yavaş 4G'de LCP'yi
  // ~2-3s geciktirir). Idle veya ilk etkileşimde mount → kritik yol yarışı biter.
  const [deferred, setDeferred] = useState(false);
  const count = slides.length;
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (n: number) => {
      setDeferred(true); // herhangi bir navigasyon tüm slide'ların mount olmasını garanti eder
      setIndex(((n % count) + count) % count);
    },
    [count],
  );
  const next = useCallback(() => goTo(index + 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1), [index, goTo]);

  // Geri kalan slide'ları tarayıcı boşa çıkınca (LCP boyandıktan sonra) yükle.
  useEffect(() => {
    if (count <= 1) return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setDeferred(true), { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setDeferred(true), 1500);
    return () => clearTimeout(t);
  }, [count]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [next, paused, count]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (count === 0) return null;

  return (
    <section className="bg-paper-50">
      <Container className="pt-6 md:pt-8 pb-2">
        <div
          ref={containerRef}
          tabIndex={0}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          className="relative overflow-hidden rounded-2xl shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-brand-300/50"
        >
          {/* Banner oranı (1525×540). Mobilde de aynı oran → kırpma yok, tam görünür. */}
          <div className="relative w-full aspect-[1525/540]">
            {slides.map((s, i) => {
              const active = i === index;
              // İlk slide hemen yüklenir (LCP adayı + priority); kalanlar idle/etkileşime
              // kadar ertelenir, böylece LCP görseliyle bant genişliği yarışı olmaz.
              const mounted = i === 0 || deferred;
              const img = mounted ? (
                <Image
                  src={s.imageUrl}
                  alt={s.title}
                  fill
                  priority={i === 0}
                  // Banner'lar metin/gradyan içerir → varsayılan q75 AVIF/WebP metni bulanıklaştırıyor.
                  // q95 near-lossless; yüksek-DPI'da srcset tam kaynak çözünürlüğü (1525px) servis eder.
                  quality={95}
                  sizes="(min-width:1280px) 1200px, 100vw"
                  className="object-cover"
                />
              ) : null;
              return (
                <div
                  key={s.id}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-700 ease-out",
                    active ? "opacity-100" : "opacity-0 pointer-events-none",
                  )}
                  aria-hidden={!active}
                >
                  {img &&
                    (s.ctaHref ? (
                      <Link href={s.ctaHref} aria-label={s.title} className="block w-full h-full">
                        {img}
                      </Link>
                    ) : (
                      img
                    ))}
                </div>
              );
            })}
          </div>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Önceki"
                className="hidden md:grid place-items-center absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-paper-50/85 backdrop-blur hover:bg-paper-50 text-ink-900 shadow-lg transition-all hover:scale-105 z-20"
              >
                <CaretLeft size={20} weight="bold" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Sonraki"
                className="hidden md:grid place-items-center absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-paper-50/85 backdrop-blur hover:bg-paper-50 text-ink-900 shadow-lg transition-all hover:scale-105 z-20"
              >
                <CaretRight size={20} weight="bold" />
              </button>
              <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Slayt ${i + 1}: ${s.title}`}
                    className={cn(
                      "relative h-2 rounded-full transition-all duration-300 before:absolute before:-inset-3 before:content-['']",
                      i === index ? "w-8 bg-paper-50" : "w-2 bg-paper-50/60 hover:bg-paper-50/85",
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
