"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight, ArrowRight } from "@phosphor-icons/react";
import { cn } from "@markala/ui";
import type { HeroBannerData } from "@/lib/catalog";
import { track as gaTrack } from "@/lib/analytics";
import { track as vaTrack } from "@/lib/visitor-analytics";

/**
 * Hero'nun görsel paneli (2026-08-31 anasayfa yeniden düzeni).
 *
 * Eski PremiumHeroSlider'dan farkı: görsel artık sayfayı edge-to-edge kaplamıyor,
 * SABİT ORANLI bir kutunun içinde `object-cover` ile duruyor. Böylece slaytlar için
 * ayrı mobil (dikey) görsel hazırlama zorunluluğu kalkıyor — tek yatay görsel her iki
 * kırılımda da düzgün kırpılıyor.
 *
 * OTOMATİK DÖNME yalnız masaüstünde (lg+), hover/focus'ta ve hareket azaltma tercihi
 * açıkken durur. Mobilde hiç çalışmaz: dokunmatikte "duraklat" sinyali yok, kullanıcı
 * okurken slayt kayıyordu (Baymard anasayfa carousel şartı #7).
 *
 * ÖLÇÜM (2026-08-31): daha önce slayta tıklanıp tıklanmadığına dair TEK BİR veri
 * noktamız yoktu; 12 kayıtlı slayttan hangisinin işe yaradığı bilinmiyordu. Artık her
 * slaydın ilk görünümü ve her tıklama hem GA4'e hem birinci-parti analitiğe yazılıyor.
 * İkisi de çerez onayına bağlı; onay yoksa sessizce yutulur.
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
  // prefers-reduced-motion: hareket hassasiyeti olan kullanıcıda otomatik geçiş kapanır.
  const [azHareket, setAzHareket] = useState(false);
  // İLK BOYAMADA ANİMASYON YOK (2026-08-31 LCP teşhisi): `animate-fade-up` opacity:0'dan
  // başlıyor ve LCP öğesini saran bağlantıya uygulanıyordu. Tarayıcı bir öğeyi GÖRÜNÜR
  // olana kadar LCP saymaz — görsel 220ms'de inmiş olsa bile animasyon bitene kadar LCP
  // saati işliyordu (PSI dökümü: LCP'nin %92'si "öğe oluşturma gecikmesi", 2.630 ms).
  // İlk render'da false → SSR/istemci HTML'i aynı kalır ve LCP öğesi tam opaklıkta boyanır.
  // Slayt DEĞİŞİMLERİNDE animasyon korunur; geçişi görünür kılan tek şey o.
  const [animasyonlu, setAnimasyonlu] = useState(false);

  // İndeksi değiştiren her yol animasyonu açar — ilk boyama hariç her geçiş yumuşak kalır.
  const goTo = useCallback(
    (n: number) => {
      setAnimasyonlu(true);
      setIndex(((n % count) + count) % count);
    },
    [count],
  );
  const next = useCallback(() => {
    setAnimasyonlu(true);
    setIndex((i) => (i + 1) % count);
  }, [count]);
  const prev = useCallback(() => {
    setAnimasyonlu(true);
    setIndex((i) => (i - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    const genis = window.matchMedia("(min-width: 1024px)");
    const hareket = window.matchMedia("(prefers-reduced-motion: reduce)");
    const uygula = () => {
      setMasaustu(genis.matches);
      setAzHareket(hareket.matches);
    };
    uygula();
    genis.addEventListener("change", uygula);
    hareket.addEventListener("change", uygula);
    return () => {
      genis.removeEventListener("change", uygula);
      hareket.removeEventListener("change", uygula);
    };
  }, []);

  const otomatik = masaustu && !azHareket && !paused && count > 1;

  useEffect(() => {
    if (!otomatik) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [otomatik, next]);

  // Slayt sayısı değişirse indeks aralık dışında kalmasın.
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [index, count]);

  // --- Ölçüm: her slaydın SAYFA BAŞINA İLK görünümü bir kez sayılır ------------
  // Aynı slayt otomatik dönmeyle tekrar geldiğinde yeniden yazılmaz; yoksa gösterim
  // sayısı şişer ve tıklama oranı anlamsızlaşır.
  const gorulen = useRef<Set<string>>(new Set());
  useEffect(() => {
    const s = slides[index];
    if (!s || gorulen.current.has(s.id)) return;
    gorulen.current.add(s.id);
    gaTrack("hero_slide_view", {
      slide_id: s.id,
      slide_position: index + 1,
      slide_title: s.title,
    });
    vaTrack("hero_slide_view", {
      type: "hero_slide_view",
      productSlug: s.id,
      value: index + 1,
    });
  }, [index, slides]);

  const tiklamaOlcu = useCallback(
    (s: HeroBannerData, i: number) => {
      gaTrack("hero_slide_click", {
        slide_id: s.id,
        slide_position: i + 1,
        slide_title: s.title,
        link_url: s.ctaHref || "/urunler",
      });
      vaTrack("hero_slide_click", {
        type: "hero_slide_click",
        productSlug: s.id,
        value: i + 1,
      });
    },
    [],
  );

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
  const hedef = slide.ctaHref || "/urunler";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-ink-900",
        // TEK oran, her kırılımda aynı (2026-08-31 düzeltme). Eskiden masaüstünde
        // `lg:aspect-[4/3]` idi; kayıtlı slaytlar 3840×1344 (≈2,86:1) GENİŞ BANNER ve
        // metinleri görsele gömülü olduğu için `object-cover` görselin ortadaki ~%47'sini
        // bırakıp iki yandaki yazıyı kesiyordu ("...k, Antetli ... Vinil ... Folyosu").
        // Sabit oran + `object-contain` → hangi ölçüde görsel yüklenirse yüklensin kırpma
        // yok ve slayt değişiminde kutu yüksekliği oynamadığı için CLS de üretmiyor.
        "aspect-[16/9]",
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
        href={hedef}
        aria-label={slide.title}
        onClick={(e) => {
          if (suppressClickRef.current) {
            e.preventDefault();
            suppressClickRef.current = false;
            return;
          }
          tiklamaOlcu(slide, index);
        }}
        className={cn(
          "block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
          animasyonlu && !azHareket && "animate-fade-up",
        )}
      >
        {/* Zemin: aynı görselin bulanık/karartılmış kopyası. `object-contain` görselin
            oranı kutununkinden farklıysa boşluk bırakır; düz siyah bant yerine görselin
            kendi rengiyle dolduruyoruz. Aynı src olduğu için EK İNDİRME YOK (tarayıcı
            tek istek yapar), ekran okuyucudan gizli. */}
        <Image
          src={slide.imageUrl}
          alt=""
          aria-hidden
          fill
          sizes="(min-width:1024px) 42vw, 100vw"
          // priority YOK: aynı src ön plandaki görselle paylaşıldığı için tek istek iner;
          // burada da priority verilirse aynı href için ikinci bir <link rel=preload> basılır.
          // MOBİLDE KAPALI (2026-08-31 LCP teşhisi): blur-2xl = 40px Gaussian bulanıklık,
          // tam genişlikte ve %110 büyütülmüş — düşük segment cihazda rasterleştirmesi
          // pahalı ve LCP ile AYNI boyama karesinde. `hidden` ile mobilde hiç boyanmaz,
          // object-contain boşluklarını kapsayıcının `bg-ink-900` zemini doldurur.
          // Ek indirme zaten yoktu (aynı src) — kazanç tamamen boyama tarafında.
          className="hidden lg:block object-cover scale-110 blur-2xl brightness-[.45]"
        />
        <Image
          src={slide.imageUrl}
          alt={slide.title}
          fill
          sizes="(min-width:1024px) 42vw, 100vw"
          // İlk slayt LCP adayı: preload + fetchpriority=high + eager.
          priority={index === 0}
          // contain: banner görselin TAMAMI görünür, hiçbir kenarı kırpılmaz.
          className="object-contain"
        />

        {/* Metin katmanı — başlık/alt başlık GÖRSELE GÖMÜLÜ DEĞİL, gerçek HTML.
            Böylece Google ve ekran okuyucu okuyabiliyor; ayrıca slayt görselleri
            metinsiz hazırlanabildiği için tek görsel her kırılımda kullanılabiliyor. */}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/90 via-ink-900/60 to-transparent p-4 pt-12">
          <span className="block text-paper-50 text-base md:text-lg font-semibold leading-snug line-clamp-2">
            {slide.title}
          </span>
          {slide.subtitle && (
            <span className="mt-1 block text-paper-100/85 text-xs md:text-sm leading-snug line-clamp-2">
              {slide.subtitle}
            </span>
          )}
          <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-brand-500 px-3.5 py-1.5 text-xs md:text-sm font-semibold text-ink-900">
            {slide.ctaLabel || "İncele"} <ArrowRight size={13} weight="bold" />
          </span>
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

          {/* İlerleme göstergesi — kullanıcı bir sonraki geçişin NE ZAMAN olacağını görsün
              ("slayt kaydı, kayboldum" hissini önler). Otomatik dönme kapalıyken (mobil,
              hover, az-hareket tercihi) çubuk dolmaz; sadece konum göstergesi olarak kalır. */}
          {/* Noktalar SOLDA (2026-08-31): sağ üstteyken küçük mobil ekranlarda sağ alttaki
              WhatsApp FAB'ının tam altına düşüyordu — ölçümde "Slayt 2" ve "Slayt 3"
              düğmelerinin üstü kapanıyordu, yani noktalara basarak slayt geçilemiyordu.
              FAB sağ sütunda sabit olduğu için çözüm noktaları o sütundan çıkarmak. */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
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
                    "block h-1.5 overflow-hidden rounded-full transition-all duration-300",
                    i === index ? "w-8 bg-paper-50/35" : "w-1.5 bg-paper-50/55 hover:bg-paper-50/90",
                  )}
                >
                  {i === index && (
                    <span
                      // key={index}: her slayt değişiminde animasyon baştan başlasın.
                      key={index}
                      className={cn(
                        "block h-full rounded-full bg-paper-50",
                        otomatik ? "animate-hero-progress" : "w-full",
                      )}
                      style={otomatik ? { animationDuration: `${AUTOPLAY_MS}ms` } : undefined}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
