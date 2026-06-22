"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CaretLeft, CaretRight, Sparkle } from "@phosphor-icons/react";
import { Container, cn } from "@markala/ui";
import { type HeroSlide } from "@markala/mock-data";
import { MagneticButton } from "@/components/ui/magnetic-button";

const AUTOPLAY_MS = 6000;

// Eşit boyutlu placeholder (visual yüklenirken layout shift olmasın) — yüklenirken
// hafif shimmer (animate-pulse) ile boş-alan algısını azaltır.
const VisualPlaceholder = () => (
  <div
    className="relative w-full max-w-[440px] h-[440px] md:h-[480px] mx-auto rounded-3xl bg-gradient-to-br from-paper-100 via-paper-200 to-paper-50 animate-pulse"
    aria-hidden="true"
  />
);

// 4 visual variant — dynamic import (ssr: false ile bundle'dan çıkarılır)
const DesignStackVisual = dynamic(
  () => import("./hero-visuals/design-stack").then((m) => m.DesignStackVisual),
  { loading: () => <VisualPlaceholder />, ssr: false },
);
const CardStackVisual = dynamic(
  () => import("./hero-visuals/card-stack").then((m) => m.CardStackVisual),
  { loading: () => <VisualPlaceholder />, ssr: false },
);
const MugVisual = dynamic(() => import("./hero-visuals/mug").then((m) => m.MugVisual), {
  loading: () => <VisualPlaceholder />,
  ssr: false,
});
const BannerDisplayVisual = dynamic(
  () => import("./hero-visuals/banner-display").then((m) => m.BannerDisplayVisual),
  { loading: () => <VisualPlaceholder />, ssr: false },
);

const themeStyles: Record<
  HeroSlide["theme"],
  {
    bg: string;
    text: string;
    textMuted: string;
    badge: string;
    decor: string;
    ctaVariant: "primary" | "ghost-cyan" | "ghost-light";
  }
> = {
  yellow: {
    bg: "bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600",
    text: "text-ink-900",
    textMuted: "text-ink-700/80",
    badge: "bg-ink-900 text-brand-300",
    decor: "bg-ink-900/8",
    ctaVariant: "primary",
  },
  ink: {
    bg: "bg-gradient-to-br from-ink-900 via-[#161A26] to-ink-700",
    text: "text-paper-50",
    textMuted: "text-paper-100/70",
    badge: "bg-brand-500 text-ink-900",
    decor: "bg-brand-500/12",
    ctaVariant: "primary",
  },
  cyan: {
    bg: "bg-gradient-to-br from-[#7DD8E8] via-[#5BE5FF] to-[#00D9FF]",
    text: "text-ink-900",
    textMuted: "text-ink-700/80",
    badge: "bg-ink-900 text-paper-50",
    decor: "bg-paper-50/15",
    ctaVariant: "primary",
  },
  cream: {
    bg: "bg-gradient-to-br from-paper-100 via-paper-50 to-paper-200",
    text: "text-ink-900",
    textMuted: "text-ink-700",
    badge: "bg-brand-500 text-ink-900",
    decor: "bg-brand-500/10",
    ctaVariant: "primary",
  },
};

export function HeroCarousel({ slides }: { slides?: HeroSlide[] }) {
  const heroSlides = slides ?? [];
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!heroSlides.length) return null;

  const goTo = useCallback(
    (next: number, dir = 1) => {
      setDirection(dir);
      setIndex(((next % heroSlides.length) + heroSlides.length) % heroSlides.length);
    },
    [heroSlides.length],
  );

  const next = useCallback(() => goTo(index + 1, 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1, -1), [index, goTo]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [next, paused]);

  // Klavye navigasyonu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const slide = heroSlides[index]!;
  const theme = themeStyles[slide.theme];

  return (
    <section className="relative bg-paper-50">
      <Container className="pt-6 md:pt-8 pb-2">
        <div
          ref={containerRef}
          tabIndex={0}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="relative overflow-hidden rounded-2xl shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-brand-300/50"
          style={{ minHeight: "min(640px, 75vh)" }}
        >
          <AnimatePresence custom={direction} mode="popLayout" initial={false}>
            <motion.div
              key={slide.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className={cn("absolute inset-0 grid lg:grid-cols-12 items-center", theme.bg)}
            >
              {/* Decorative blob 1 */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.1 }}
                className={cn(
                  "absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-3xl",
                  theme.decor,
                )}
                aria-hidden="true"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.3 }}
                className={cn(
                  "absolute -bottom-40 -left-32 w-[400px] h-[400px] rounded-full blur-3xl",
                  theme.decor,
                )}
                aria-hidden="true"
              />

              {/* Content */}
              <div className="relative lg:col-span-6 px-8 md:px-14 lg:px-16 py-12 md:py-16 z-10">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide",
                    theme.badge,
                  )}
                >
                  <Sparkle size={12} weight="fill" />
                  {slide.eyebrow}
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "mt-5 text-display-xl font-serif leading-[1.02] max-w-xl",
                    theme.text,
                  )}
                >
                  {slide.highlightWord ? (
                    <SplitTitle
                      title={slide.title}
                      highlight={slide.highlightWord}
                      themeName={slide.theme}
                    />
                  ) : (
                    slide.title
                  )}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className={cn(
                    "mt-6 text-lg md:text-xl leading-relaxed max-w-lg",
                    theme.textMuted,
                  )}
                >
                  {slide.description}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.55 }}
                  className="mt-8 flex flex-wrap items-center gap-3"
                >
                  <MagneticButton href={slide.ctaHref} variant={theme.ctaVariant}>
                    {slide.ctaLabel} <ArrowRight size={18} weight="bold" />
                  </MagneticButton>
                  {slide.secondaryCtaHref && (
                    <a
                      href={slide.secondaryCtaHref}
                      className={cn(
                        "text-sm font-medium underline-offset-4 hover:underline transition-colors",
                        theme.text,
                      )}
                    >
                      {slide.secondaryCtaLabel} →
                    </a>
                  )}
                </motion.div>

                {(slide.size || slide.badge) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
                  >
                    {slide.size && (
                      <span className={cn("flex items-center gap-2", theme.textMuted)}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                        {slide.size}
                      </span>
                    )}
                    {slide.badge && (
                      <span className={cn("flex items-center gap-2 font-medium", theme.text)}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {slide.badge}
                      </span>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Right visual — image OR design-stack */}
              <div className="relative lg:col-span-6 h-full flex items-center justify-center px-6 md:px-10 lg:px-12 pb-10 lg:pb-0">
                {slide.visualType === "design-stack" ? (
                  <DesignStackVisual />
                ) : slide.visualType === "card-stack" ? (
                  <CardStackVisual />
                ) : slide.visualType === "mug-3d" ? (
                  <MugVisual />
                ) : slide.visualType === "banner-display" ? (
                  <BannerDisplayVisual />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full max-w-[520px] aspect-square"
                  >
                    <div
                      className="absolute inset-0 rounded-full blur-3xl opacity-40"
                      style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }}
                    />
                    <div className="relative w-full h-full">
                      <Image
                        src={slide.productImage}
                        alt={slide.title}
                        fill
                        priority
                        sizes="(min-width:1024px) 50vw, 100vw"
                        className="object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.25)]"
                      />
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.8 }}
                      className="hidden md:flex absolute bottom-4 -left-4 items-center gap-2 px-3 py-2 bg-paper-50 rounded-md shadow-lg text-xs"
                    >
                      <Sparkle size={14} weight="fill" className="text-brand-500" />
                      <span className="font-medium text-ink-900">Tasarım desteği ücretsiz</span>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Nav arrows */}
          <button
            onClick={prev}
            className="hidden md:grid place-items-center absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-paper-50/85 backdrop-blur hover:bg-paper-50 text-ink-900 shadow-lg transition-all hover:scale-105 z-20"
            aria-label="Önceki"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <button
            onClick={next}
            className="hidden md:grid place-items-center absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-paper-50/85 backdrop-blur hover:bg-paper-50 text-ink-900 shadow-lg transition-all hover:scale-105 z-20"
            aria-label="Sonraki"
          >
            <CaretRight size={20} weight="bold" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {heroSlides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i, i > index ? 1 : -1)}
                aria-label={`Slide ${i + 1}: ${s.title}`}
                className={cn(
                  // before: ile tıklanabilir alan ~32px (görsel dot aynı kalır) — mobil dokunma hedefi
                  "relative h-2 rounded-full transition-all duration-300 before:absolute before:-inset-3 before:content-['']",
                  i === index ? "w-10 bg-paper-50/95" : "w-2 bg-paper-50/50 hover:bg-paper-50/70",
                )}
              />
            ))}
          </div>

          {/* Progress bar */}
          {!paused && (
            <motion.div
              key={index + "-progress"}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
              className="absolute bottom-0 left-0 right-0 h-1 origin-left bg-paper-50/40"
            />
          )}
        </div>
      </Container>
    </section>
  );
}

function SplitTitle({
  title,
  highlight,
  themeName,
}: {
  title: string;
  highlight: string;
  themeName: HeroSlide["theme"];
}) {
  const idx = title.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return <>{title}</>;
  const before = title.slice(0, idx);
  const match = title.slice(idx, idx + highlight.length);
  const after = title.slice(idx + highlight.length);

  const highlightCls =
    themeName === "yellow"
      ? "underline decoration-ink-900 decoration-[6px] underline-offset-[6px]"
      : themeName === "ink"
        ? "text-brand-300"
        : themeName === "cyan"
          ? "underline decoration-ink-900 decoration-[6px] underline-offset-[6px]"
          : "underline decoration-brand-500 decoration-[6px] underline-offset-[6px]";

  return (
    <>
      {before}
      <span className={highlightCls}>{match}</span>
      {after}
    </>
  );
}
