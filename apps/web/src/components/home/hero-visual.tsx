"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { cn } from "@markala/ui";
import type { HeroBannerData } from "@/lib/catalog";

/**
 * Hero'nun görsel paneli (2026-08-31 anasayfa yeniden düzeni).
 *
 * Eski PremiumHeroSlider'dan farkı: görsel artık sayfayı edge-to-edge kaplamıyor,
 * SABİT ORANLI bir kutunun içinde `object-cover` ile duruyor. Böylece slaytlar için
 * ayrı mobil (dikey) görsel hazırlama zorunluluğu kalkıyor — tek yatay görsel her iki
 * kırılımda da düzgün kırpılıyor.
 *
 * OTOMATİK DÖNME yalnız masaüstünde (lg+) ve hover/focus'ta duruyor. Mobilde hiç
 * çalışmıyor: dokunmatikte "duraklat" sinyali yok, kullanıcı okurken slayt kayıyordu
 * (Baymard anasayfa carousel şartı #7). Mobilde parmakla kaydırma ve noktalar kalıyor.
 */
const AUTOPLAY_MS = 7000;
/** Slayt değiştirmek için gereken en az yatay parmak hareketi (px) — kazara dokunuşta
 *  slayt atlamasın diye tıklama toleransından (~10px) belirgin yüksek. */
const SWIPE_MIN_PX = 45;

export function HeroVisual({ slides }: { slides: HeroBannerData[] }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Otomatik dönme SADECE masaüstünde. İlk render'da false → sunucu/istemci HTML'i aynı.
  const [masaustu, setMasaustu] = useState(false);

  const goTo = useCallback((n: number) => setIndex(((n % count) + count) % count), [count]);
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const uygula = () => setMasaustu(mq.matches);
    uygula();
    mq.addEventListener("change", uygula);
    return () => mq.removeEventListener("change", uygula);
  }, []);

  useEffect(() => {
    if (!masaustu || paused || count <= 1) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [masaustu, paused, count, next]);

  // Slayt sayısı değişirse indeks aralık dışında kalmasın.
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [index, count]);

  // --- Parmakla kaydırma (eski slider'daki iki tuzak korundu) ---
  // 1) Dikey kaydırma bozulmamalı → touchmove'da preventDefault YOK.
  // 2) Slayt bir <Link>; kaydırma sonrası tarayıcının ürettiği click yutulmalı.
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    suppressClickRef.current = false;
    touchRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchRef.current;
      touchRef.current = null;
      if (!start || count <= 1) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < SWIPE_MIN_PX) return;
      suppressClickRef.current = true;
      if (dx < 0) next();
      else prev();
    },
    [count, next, prev],
  );

  if (count === 0) return null;
  const slide = slides[Math.min(index, count - 1)]!;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-ink-900",
        // Mobilde geniş-kısa şerit (dikey görsel gerekmez), masaüstünde metin sütunuyla
        // aynı hizaya oturan daha kare bir panel.
        "aspect-[16/7] lg:aspect-[4/3]",
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        touchRef.current = null;
      }}
      aria-roledescription="carousel"
      aria-label="Markala öne çıkanlar"
    >
      <Link
        key={slide.id + index}
        href={slide.ctaHref || "/urunler"}
        aria-label={slide.title}
        onClick={(e) => {
          if (suppressClickRef.current) {
            e.preventDefault();
            suppressClickRef.current = false;
          }
        }}
        className="block h-full w-full animate-fade-up focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        <Image
          src={slide.imageUrl}
          alt={slide.title}
          fill
          sizes="(min-width:1024px) 42vw, 100vw"
          // İlk slayt LCP adayı: preload + fetchpriority=high + eager.
          priority={index === 0}
          className="object-cover"
        />
        {/* Alt gradyan — slayt başlığı her görselde okunur kalsın. */}
        <span className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink-900/85 to-transparent" />
        <span className="absolute bottom-3 left-3 right-3 text-paper-50 text-sm md:text-base font-semibold leading-snug line-clamp-2">
          {slide.title}
        </span>
      </Link>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Önceki slayt"
            className="hidden lg:grid place-items-center absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-ink-900/45 hover:bg-ink-900/70 border border-paper-50/20 text-paper-50 backdrop-blur transition-all z-20"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Sonraki slayt"
            className="hidden lg:grid place-items-center absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-ink-900/45 hover:bg-ink-900/70 border border-paper-50/20 text-paper-50 backdrop-blur transition-all z-20"
          >
            <CaretRight size={16} weight="bold" />
          </button>
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
            {slides.map((s, i) => (
              // Dokunma hedefi ≥24px (PSI target-size): buton gerçek 24px kutu,
              // görsel çubuk içteki span'da.
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Slayt ${i + 1}`}
                aria-current={i === index}
                className="grid h-6 min-w-6 place-items-center"
              >
                <span
                  aria-hidden
                  className={cn(
                    "block h-1.5 rounded-full transition-all duration-300",
                    i === index ? "w-6 bg-paper-50" : "w-1.5 bg-paper-50/60 hover:bg-paper-50/90",
                  )}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
