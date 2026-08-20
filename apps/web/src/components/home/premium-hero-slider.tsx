"use client";

import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@markala/ui";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { HeroBannerData } from "@/lib/catalog";

/**
 * Anasayfa hero — DB (hero_slides) kaynaklı saf GÖRSEL slider.
 * Slaytlar admin panelinden yönetilir (görsel/link/sıra/aktiflik + mobil görsel).
 * Görsel slider alanını TAM kaplar (edge-to-edge). SEO için görünmez h1.
 */
const AUTOPLAY_MS = 6000;
/** Slayt değiştirmek için gereken en az yatay parmak hareketi (px). Kazara dokunuşta
 *  slayt atlamasın diye tıklama toleransından (~10px) belirgin şekilde yüksek. */
const SWIPE_MIN_PX = 45;

/** API boş/erişilemezse gösterilecek yedek (public/hero statik). */
const FALLBACK: HeroBannerData[] = [
  {
    id: "fb-online",
    imageUrl: "/hero/hero-online-matbaa.jpg",
    ctaHref: "/urunler",
    title: "Kartvizitten brandaya tüm baskı işin tek panelde",
  },
  {
    id: "fb-tasarim",
    imageUrl: "/hero/hero-tasarim-destegi.jpg",
    ctaHref: "/iletisim",
    title: "Tasarımcın yoksa biz hallederiz — ücretsiz tasarım desteği",
  },
  {
    id: "fb-kampanya",
    imageUrl: "/hero/hero-kampanya-paketleri.jpg",
    ctaHref: "/kampanyalar",
    title: "Hazır paketlerle daha az öde, tek teslimde al",
  },
];

export function PremiumHeroSlider({ slides }: { slides?: HeroBannerData[] }) {
  const items = slides && slides.length > 0 ? slides : FALLBACK;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;
  const ref = useRef<HTMLElement>(null);

  const goTo = useCallback((n: number) => setIndex(((n % count) + count) % count), [count]);
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  // --- Mobil kaydırma (swipe) ---------------------------------------------------
  // 2026-08-20: mobilde slider parmakla kaydırılamıyordu. Sebep: bileşende hiç dokunma
  // işleyicisi yoktu; ok butonları da `hidden md:grid` olduğu için mobilde görünmüyor,
  // geriye yalnız alttaki noktalar kalıyordu.
  //
  // İki tuzağa dikkat edildi:
  //  1) DİKEY KAYDIRMA BOZULMAMALI → touchmove'da preventDefault ÇAĞRILMIYOR; yatay
  //     hareket dikeyden büyük değilse hiç müdahale etmiyoruz, sayfa normal kayıyor.
  //  2) Slaytın tamamı bir <Link> → parmak kaldırınca tarayıcı click üretir ve ürün
  //     sayfasına gider. Kaydırma algılandıysa bir sonraki click bastırılır.
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    // Her yeni dokunuşta sıfırla: kaydırma sonrası click hiç gelmezse bayrak asılı
    // kalıp SONRAKİ geçerli tıklamayı yutardı.
    suppressClickRef.current = false;
    touchRef.current = { x: t.clientX, y: t.clientY };
    setPaused(true);
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchRef.current;
      touchRef.current = null;
      setPaused(false);
      if (!start || count <= 1) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      // Yatay niyet: yatay hareket dikeyden büyük VE eşiği aşmış olmalı.
      if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < SWIPE_MIN_PX) return;
      suppressClickRef.current = true;
      if (dx < 0) next();
      else prev();
    },
    [count, next, prev],
  );

  // İndeks aralık dışına düşerse (slayt sayısı değişirse) sıfırla.
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [index, count]);

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

  const slide = items[Math.min(index, count - 1)]!;

  return (
    <section
      ref={ref}
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        touchRef.current = null;
        setPaused(false);
      }}
      aria-roledescription="carousel"
      aria-label="Markala öne çıkanlar"
      className="relative overflow-hidden bg-ink-900 outline-none focus-visible:ring-4 focus-visible:ring-brand-300/40"
    >
      {/* SEO — görünmez ana başlık (slider saf görsel olduğundan) */}
      <h1 className="sr-only">
        Markala — Online Matbaa: Kartvizit, broşür, afiş, branda, tabela ve tüm baskı ürünleri
      </h1>

      {/* Görsel slider alanı TAM kaplar (edge-to-edge). key={index} → fade animasyonu. */}
      <Link
        key={slide.id + index}
        href={slide.ctaHref || "/urunler"}
        aria-label={slide.title}
        // Kaydırma sonrası tarayıcının ürettiği click'i yut — parmakla slayt geçerken
        // yanlışlıkla ürün sayfasına gitmeyi engeller.
        onClick={(e) => {
          if (suppressClickRef.current) {
            e.preventDefault();
            suppressClickRef.current = false;
          }
        }}
        className="block group animate-fade-up focus-visible:outline-none"
      >
        {/* LCP: ham <img> yerine next/image — srcset/sizes ile cihaz genişliğine uygun
            (küçük) optimize varyant iner; mobil ayrı görsel varsa art-direction korunur. */}
        {slide.mobileImageUrl ? (
          <HeroArtDirectedImage slide={slide} isFirst={index === 0} />
        ) : (
          <Image
            src={slide.imageUrl}
            alt={slide.title}
            width={2120}
            height={742}
            sizes="100vw"
            // İlk slayt = LCP: priority → preload + fetchpriority="high" + eager.
            // Sonraki slaytlar lazy (mevcut davranışla birebir).
            priority={index === 0}
            loading={index === 0 ? undefined : "lazy"}
            className="block w-full h-auto"
          />
        )}
      </Link>

      {/* Kontroller — ok + nokta */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Önceki slayt"
            className="hidden md:grid place-items-center absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-ink-900/40 hover:bg-ink-900/60 border border-paper-50/20 text-paper-50 backdrop-blur transition-all hover:scale-105 z-20"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Sonraki slayt"
            className="hidden md:grid place-items-center absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-ink-900/40 hover:bg-ink-900/60 border border-paper-50/20 text-paper-50 backdrop-blur transition-all hover:scale-105 z-20"
          >
            <CaretRight size={20} weight="bold" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {items.map((s, i) => (
              // Dokunma hedefi ≥24px (PSI target-size): buton gerçek 24px kutu, görsel çubuk
              // içteki span'da. Eski ::before -inset-3 hilesi komşu hedeflerle ÇAKIŞTIĞI için
              // axe yine düşürüyordu — gerçek kutu + gap çakışmayı bitirir.
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
                    "block h-2 rounded-full transition-all duration-300",
                    i === index ? "w-8 bg-paper-50" : "w-2 bg-paper-50/60 hover:bg-paper-50/90",
                  )}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/**
 * Mobil varyantı olan slaytlar için art-direction: <Image> tek başına <picture> desteklemez;
 * getImageProps ile HER İKİ kaynağın da optimize srcset'i üretilir (resmî Next 14.1+ deseni).
 * Böylece mobil kırılımda admin'in yüklediği mobil görsel, desktop'ta desktop görsel iner —
 * eski ham <picture>/<img> davranışıyla birebir, ama artık _next/image optimize varyantlarıyla.
 *
 * Notlar:
 * - getImageProps preload <link>'i EKLEMEZ; ilk slaytta priority=true'nun ürettiği
 *   fetchpriority="high" + eager, tarayıcı preload-scanner'ı ile aynı işi görür
 *   (önceki ham <img> yaklaşımına eşdeğer, gerileme yok).
 *
 * CLS (2026-08-20 hız şartnamesi P4) — ÇÖZÜLDÜ:
 * `<img>`'nin width/height'ı MASAÜSTÜ görseline ait (2120×742 → oran 2,857). Mobilde ise
 * `<source>` 0,844 oranlı DİKEY görseli indiriyordu. Tarayıcı yükleme öncesi kısa-geniş bir
 * kutu ayırıp görsel gelince kutuyu boyuna büyütüyor, altındaki her şey aşağı itiliyordu →
 * ana sayfa mobil CLS 0,292 (eşik 0,1) ve kayan öğe olarak hero'nun hemen altındaki
 * `<section class="bg-paper-50 py-12">` ölçüldü.
 *
 * Çözüm: oran, `<source>` ile AYNI kırılımda (767/768 px) CSS `aspect-ratio` olarak rezerve
 * edilir. Tailwind `md:` = min-width 768px, `<source>` = max-width 767px → tam hizalı.
 * Oranlar mevcut görsellerle de Hasan'ın hazırladığı yeni setle de uyumlu:
 *   mobil   1080×1280 = 0,8438  ·  yeni 1440×1706 = 0,8440  (fark %0,04, göze görünmez)
 *   masaüstü 2120×742 = 2,8571  ·  yeni 3840×1344 = 2,8571  (birebir aynı)
 * Oranlar gerçek görsel oranlarıyla eşleştiği için sıkışma/kırpılma olmaz.
 */
const HERO_RATIO_MOBILE = "aspect-[1440/1706]";
const HERO_RATIO_DESKTOP = "md:aspect-[3840/1344]";

function HeroArtDirectedImage({ slide, isFirst }: { slide: HeroBannerData; isFirst: boolean }) {
  const shared = { alt: slide.title, width: 2120, height: 742, sizes: "100vw" };
  const {
    props: { srcSet: mobileSrcSet, sizes: mobileSizes },
  } = getImageProps({ ...shared, src: slide.mobileImageUrl! });
  const { props: imgProps } = getImageProps({
    ...shared,
    src: slide.imageUrl,
    priority: isFirst,
    loading: isFirst ? undefined : "lazy",
  });
  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={mobileSrcSet} sizes={mobileSizes} />
      {/* getImageProps deseni ham <img> gerektirir (alt/decoding/fetchpriority imgProps'ta) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...imgProps}
        alt={slide.title}
        className={`block w-full h-auto ${HERO_RATIO_MOBILE} ${HERO_RATIO_DESKTOP}`}
      />
    </picture>
  );
}
