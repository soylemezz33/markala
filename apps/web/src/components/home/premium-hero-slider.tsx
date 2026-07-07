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
  /** Sağ panel — tasarımcı ürün mockup görseli (yalnız lg+; mobilde gizli → indirilmez). */
  image: string;
  imageAlt: string;
}

const SLIDES: Slide[] = [
  {
    eyebrow: "Online Matbaa",
    image: "/hero/hero-online-matbaa.jpg",
    imageAlt: "Markala — 30+ matbaa ve reklam ürünü tek panelde; rollup banner ve kartvizit görseli",
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
    image: "/hero/hero-tasarim-destegi.jpg",
    imageAlt: "Markala — sipariş ile ücretsiz tasarım desteği; baskılı kupa, spiralli defter ve kalem görseli",
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
    image: "/hero/hero-kampanya-paketleri.jpg",
    imageAlt: "Markala — hazır kampanya paketleriyle %25'e varan tasarruf; rollup banner ve kartvizit görseli",
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
        <div key={index} className="py-8 md:py-10 lg:py-12 animate-fade-up">
          {/* Masaüstü (lg+) — tam tasarımcı banner; tek bütün kompozisyon, tıklanabilir.
              Banner metni görselde; tümü slide.primary linkine gider. */}
          <Link
            href={slide.primary.href}
            aria-label={slide.imageAlt}
            className="hidden lg:block group rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300/40"
          >
            <img
              src={slide.image}
              alt={slide.imageAlt}
              width={2120}
              height={742}
              loading="lazy"
              decoding="async"
              className="w-full rounded-2xl shadow-2xl ring-1 ring-paper-50/10 transition-transform duration-500 group-hover:scale-[1.008]"
            />
          </Link>

          {/* Mobil (< lg) — responsive kod-metin (h1 → SEO; banner görseli mobilde yüklenmez). */}
          <div className="lg:hidden">
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
