"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Container, Button, cn } from "@markala/ui";
import {
  Sparkle,
  CheckCircle,
  ArrowRight,
  CaretLeft,
  CaretRight,
  Package,
  Storefront,
  PaintBrush,
  IdentificationCard,
  Flag,
} from "@phosphor-icons/react";

/**
 * Anasayfa premium hero slider — koyu marketing yüzeyi (surface/ink-on-dark paleti).
 * Görsel banner yerine KODLA çizilir: her ekranda net, responsive, metni anında düzenlenebilir.
 * Slaytlar şimdilik sabit (kod); ileride admin'den yönetilebilir hale getirilebilir.
 */
interface Chip {
  icon: typeof Package;
  label: string;
}
interface Slide {
  eyebrow: string;
  title: React.ReactNode;
  desc: string;
  checks: string[];
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  card: { kicker: string; big: React.ReactNode; sub: string; note: string };
  chips: [Chip, Chip];
}

const SLIDES: Slide[] = [
  {
    eyebrow: "Online Matbaa",
    title: (
      <>
        Kartvizitten brandaya, tüm baskı işin{" "}
        <span className="text-brand-400">tek panelde</span>
      </>
    ),
    desc: "30+ matbaa & reklam ürünü online. Ücretsiz tasarım desteği, 1-2 iş günü üretim, 81 il kargo.",
    checks: ["Ücretsiz tasarım", "1-2 iş günü", "81 il kargo"],
    primary: { label: "Ürünleri Keşfet", href: "/urunler" },
    secondary: { label: "Nasıl Çalışır?", href: "/hizmetler" },
    card: {
      kicker: "Tek panelden",
      big: (
        <>
          30+<span className="text-2xl align-top"> ürün</span>
        </>
      ),
      sub: "matbaa & reklam",
      note: "Kartvizit, broşür, afiş, branda, tabela ve dahası — hepsi tek hesapta.",
    },
    chips: [
      { icon: IdentificationCard, label: "Kartvizit" },
      { icon: Flag, label: "Branda" },
    ],
  },
  {
    eyebrow: "Tasarım Dahil",
    title: (
      <>
        Tasarımcın yoksa <span className="text-brand-400">biz hallederiz</span>
      </>
    ),
    desc: "Siparişinle birlikte ücretsiz profesyonel tasarım desteği. Sen ne istediğini anlat, gerisini ekibimiz tasarlasın.",
    checks: ["Ücretsiz revizyon", "Profesyonel ekip", "Hızlı teslim"],
    primary: { label: "Tasarım Desteği Al", href: "/iletisim" },
    secondary: { label: "Örnekleri Gör", href: "/referanslar" },
    card: {
      kicker: "Sipariş ile",
      big: "Ücretsiz",
      sub: "tasarım desteği",
      note: "Logo, kartvizit, broşür — hangi ürünü alırsan al, tasarımı bizden.",
    },
    chips: [
      { icon: PaintBrush, label: "Logo" },
      { icon: IdentificationCard, label: "Kartvizit" },
    ],
  },
  {
    eyebrow: "Kampanya Paketleri",
    title: (
      <>
        Hazır paketlerle <span className="text-brand-400">daha az öde</span>, tek
        teslimde al
      </>
    ),
    desc: "Açılış, esnaf, kurumsal ve etkinlik için önceden kurgulanmış paketler. Tek tıkla sepete, tek seferde teslim.",
    checks: ["Tek tıkla sepet", "Tasarım dahil", "Tek teslim"],
    primary: { label: "Paketleri Gör", href: "/kampanyalar" },
    secondary: { label: "Özel Teklif Al", href: "/iletisim" },
    card: {
      kicker: "Paket avantajı",
      big: (
        <>
          %25<span className="text-2xl align-top">&apos;e varan</span>
        </>
      ),
      sub: "tasarruf",
      note: "Tek tek almak yerine paketle al, hem indirim kazan hem tek teslimde topla.",
    },
    chips: [
      { icon: Package, label: "Açılış Paketi" },
      { icon: Storefront, label: "Esnaf Paketi" },
    ],
  },
];

const AUTOPLAY_MS = 6000;

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
  const [ChipA, ChipB] = [slide.chips[0].icon, slide.chips[1].icon];

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
      className="relative overflow-hidden bg-ink-900 text-paper-50 outline-none focus-visible:ring-4 focus-visible:ring-brand-300/40"
    >
      {/* Radial glow'lar — kampanyalar hero'suyla aynı dil */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 w-[460px] h-[460px] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #F5B800, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-24 w-[400px] h-[400px] rounded-full opacity-[0.12] blur-3xl"
        style={{ background: "radial-gradient(circle, #00D9FF, transparent 70%)" }}
      />

      <Container className="relative">
        {/* key={index} → slayt değişince fade-up animasyonu yeniden tetiklenir */}
        <div
          key={index}
          className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-12 md:py-16 lg:min-h-[400px] animate-fade-up"
        >
          {/* Sol — metin */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 text-brand-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkle size={12} weight="fill" /> {slide.eyebrow}
            </span>
            <h1 className="mt-5 text-display-lg font-serif leading-[1.05]">{slide.title}</h1>
            <p className="mt-4 text-paper-100/70 text-lg leading-relaxed max-w-xl">{slide.desc}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-paper-100/80">
              {slide.checks.map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5">
                  <CheckCircle size={16} weight="fill" className="text-brand-400" /> {c}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={slide.primary.href}>
                <Button size="lg">
                  {slide.primary.label} <ArrowRight size={16} weight="bold" />
                </Button>
              </Link>
              <Link
                href={slide.secondary.href}
                className="inline-flex items-center gap-2 px-5 h-12 rounded-lg border border-paper-100/20 text-paper-50 hover:bg-paper-50/10 transition-colors font-medium"
              >
                {slide.secondary.label}
              </Link>
            </div>
          </div>

          {/* Sağ — avantaj kartı (CSS, görsel gerektirmez) */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto max-w-sm">
              <div className="rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-ink-900 p-7 shadow-2xl">
                <div className="text-xs font-bold uppercase tracking-wider opacity-70">
                  {slide.card.kicker}
                </div>
                <div className="mt-1 text-5xl font-serif font-semibold leading-none">
                  {slide.card.big}
                </div>
                <div className="mt-1 text-lg font-semibold">{slide.card.sub}</div>
                <div className="mt-4 pt-4 border-t border-ink-900/15 text-sm font-medium">
                  {slide.card.note}
                </div>
              </div>
              {/* Floating mini çipler */}
              <div className="absolute -top-4 -left-6 rotate-[-6deg] rounded-xl bg-surface-2 border border-surface-4 px-3 py-2 shadow-card-dark text-xs text-on-dark-200 inline-flex items-center gap-1.5">
                <ChipA size={14} className="text-brand-400" /> {slide.chips[0].label}
              </div>
              <div className="absolute -bottom-5 -right-4 rotate-[5deg] rounded-xl bg-surface-2 border border-surface-4 px-3 py-2 shadow-card-dark text-xs text-on-dark-200 inline-flex items-center gap-1.5">
                <ChipB size={14} className="text-brand-400" /> {slide.chips[1].label}
              </div>
            </div>
          </div>
        </div>
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
                aria-label={`Slayt ${i + 1}: ${s.eyebrow}`}
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
