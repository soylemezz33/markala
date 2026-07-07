"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Container, cn } from "@markala/ui";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

/**
 * Anasayfa hero — DOĞRUDAN GÖRSEL slider.
 * Her slayt tasarımcının hazır banner görseli (tam kompozisyon), tıklanabilir.
 * SEO için görünmez h1 tutulur (slider saf görsel olduğundan sayfada metin başlığı kalsın).
 */
const AUTOPLAY_MS = 6000;

interface Slide {
  image: string;
  alt: string;
  href: string;
}

const SLIDES: Slide[] = [
  {
    image: "/hero/hero-online-matbaa.jpg",
    alt: "Markala — Kartvizitten brandaya tüm baskı işin tek panelde. 30+ matbaa & reklam ürünü online, ücretsiz tasarım desteği, 81 il kargo.",
    href: "/urunler",
  },
  {
    image: "/hero/hero-tasarim-destegi.jpg",
    alt: "Markala — Tasarımcın yoksa biz hallederiz. Siparişinle birlikte ücretsiz profesyonel tasarım desteği.",
    href: "/iletisim",
  },
  {
    image: "/hero/hero-kampanya-paketleri.jpg",
    alt: "Markala — Hazır kampanya paketleriyle %25'e varan tasarruf, tek tıkla sepete tek teslimde al.",
    href: "/kampanyalar",
  },
];

export function PremiumHeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = SLIDES.length;
  const ref = useRef<HTMLElement>(null);

  const goTo = useCallback((n: number) => setIndex(((n % count) + count) % count), [count]);
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  // Autoplay — hover/focus'ta durur.
  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [next, paused, count]);

  // Klavye ile gezinme (section odaktayken).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const slide = SLIDES[index]!;

  return (
    <section
      ref={ref}
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Markala öne çıkanlar"
      className="relative overflow-hidden bg-ink-900 outline-none focus-visible:ring-4 focus-visible:ring-brand-300/40"
    >
      {/* SEO — görünmez ana başlık (slider saf görsel olduğundan) */}
      <h1 className="sr-only">
        Markala — Online Matbaa: Kartvizit, broşür, afiş, branda, tabela ve tüm baskı ürünleri
      </h1>

      <Container className="relative py-6 md:py-8">
        {/* key={index} → slayt değişince fade-up animasyonu yeniden tetiklenir */}
        <Link
          key={index}
          href={slide.href}
          aria-label={slide.alt}
          className="block group rounded-2xl animate-fade-up focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300/40"
        >
          <img
            src={slide.image}
            alt={slide.alt}
            width={2120}
            height={742}
            decoding="async"
            className="w-full rounded-2xl shadow-2xl ring-1 ring-paper-50/10 transition-transform duration-500 group-hover:scale-[1.005]"
          />
        </Link>
      </Container>

      {/* Kontroller — ok + nokta */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Önceki slayt"
            className="hidden md:grid place-items-center absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-paper-50/10 hover:bg-paper-50/20 border border-paper-50/15 text-paper-50 backdrop-blur transition-all hover:scale-105 z-20"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Sonraki slayt"
            className="hidden md:grid place-items-center absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-paper-50/10 hover:bg-paper-50/20 border border-paper-50/15 text-paper-50 backdrop-blur transition-all hover:scale-105 z-20"
          >
            <CaretRight size={20} weight="bold" />
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {SLIDES.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Slayt ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "relative h-2 rounded-full transition-all duration-300 before:absolute before:-inset-3 before:content-['']",
                  i === index ? "w-8 bg-paper-50" : "w-2 bg-paper-50/50 hover:bg-paper-50/80",
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
