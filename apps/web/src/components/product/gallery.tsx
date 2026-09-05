"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@markala/ui";
import { ProductImageFallback } from "@/components/product/product-image-fallback";
import { GalleryLightbox } from "@/components/product/gallery-lightbox";
import { MagnifyingGlassPlus } from "@phosphor-icons/react";

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
  /**
   * GÖRSEL İNCELEME (2026-09-05, Hasan: "üstüne gelince zoom yapmıyor, tıklayınca
   * açılmıyor"). İki ayrı davranış:
   *  - Masaüstünde imleci takip eden BÜYÜTEÇ: kutunun içinde kalır, sayfayı bozmaz.
   *  - Her cihazda tıklayınca TAM EKRAN pencere (gallery-lightbox.tsx).
   * Büyüteç yalnız gerçek imleçli cihazlarda: dokunmatikte "hover" bir kez takılıp
   * kalıyor ve görsel yakınlaşmış hâlde donuyordu — orada doğru davranış tam ekran.
   */
  const [lightbox, setLightbox] = useState(false);
  const [imlecliCihaz, setImlecliCihaz] = useState(false);
  const [buyutec, setBuyutec] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setImlecliCihaz(window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false);
  }, []);

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

  // Konfigüratör seçimi galeriyi yönlendirsin (2026-08-29, Hasan: "kumaş+takıma
  // tıklandığında takım görseli seçilsin"). rules.gorsel taşıyan bir seçenek
  // seçilince configurator "markala:gorsel-sec" olayı yayınlar; galeri o kareye
  // geçer. prefetch: hedef görsel henüz DOM'da değilse indirmesi başlatılır.
  useEffect(() => {
    function onSec(e: Event) {
      const idx = (e as CustomEvent<{ index?: number }>).detail?.index;
      if (typeof idx === "number" && Number.isInteger(idx) && idx >= 0 && idx < images.length) {
        prefetch(idx);
        setActive(idx);
      }
    }
    window.addEventListener("markala:gorsel-sec", onSec);
    return () => window.removeEventListener("markala:gorsel-sec", onSec);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefetch fonksiyonel setState kullanır, bayat kapanış zararsız
  }, [images.length]);

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

  // lg:max-w-full ZORUNLU: genişlik 48vh'den, yani EKRAN YÜKSEKLİĞİNDEN türüyor ve
  // sütunun genişliğinden habersiz. Uzun pencerede clamp 460px'e çıkıyor, oysa 1024px
  // genişlikte galeri sütunu ~350px; aradaki fark yan sütunun ÜSTÜNE binip ürün
  // başlığını örtüyordu (2026-08-31). max-w-full taşmayı keser, sığdığı durumlarda
  // hiçbir şeyi değiştirmez.
  return (
    <div className="lg:mx-auto lg:w-[clamp(320px,48vh,460px)] lg:max-w-full">
      {/* Kutu HER ZAMAN KARE. Masaüstünde eskiden yalnız YÜKSEKLİK sabitti
          (lg:h-[min(48vh,460px)]) ama genişlik sütunu dolduruyordu → 563x460'lık
          dikdörtgen kutuya 1080x1080 kare görsel object-cover ile oturunca üstten ve
          alttan %18'i kırpılıyordu (2026-08-28, Hasan ekran görüntüsü). Artık genişlik
          de aynı ölçüye clamp'lenir; yükseklik sınırı (fiyat+CTA scroll'suz görünsün,
          2026-08-07) böylece korunur, kırpma biter. mx-auto: küçük resimler de
          büyük görselle aynı hizada kalsın diye sarmalayıcıya uygulanır. */}
      {/*
        Kutunun kendisi artık bir DÜĞME: tıklayınca tam ekran açılır, klavyeyle de
        erişilebilir. Büyüteç imleç konumunu transform-origin'e çevirir — tek bir CSS
        dönüşümü, ek görsel indirilmez, düzen (layout) hiç değişmez.
      */}
      <button
        type="button"
        onClick={() => hasImages && !showFallback && setLightbox(true)}
        onMouseEnter={(e) => {
          if (!imlecliCihaz || showFallback) return;
          const r = e.currentTarget.getBoundingClientRect();
          setBuyutec({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseMove={(e) => {
          if (!imlecliCihaz || showFallback) return;
          const r = e.currentTarget.getBoundingClientRect();
          setBuyutec({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setBuyutec(null)}
        aria-label={hasImages ? `${alt} — görseli büyüt` : alt}
        className="group relative block w-full aspect-square bg-paper-100 rounded-lg overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2">
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
                    "object-contain transition-[opacity,transform] duration-300 ease-out",
                    i === visible ? "opacity-100" : "opacity-0",
                  )}
                  // Büyüteç YALNIZ görünen görsele uygulanır; diğerleri boşuna
                  // dönüştürülüp GPU katmanı açmasın.
                  style={
                    i === visible && buyutec
                      ? { transform: "scale(1.9)", transformOrigin: `${buyutec.x}% ${buyutec.y}%` }
                      : undefined
                  }
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

        {/* Yapılabilirlik işareti: büyütülebildiği görünsün. Yalnız hover'da belirir,
            dokunmatikte sürekli durur (orada hover yok, ipucu olmadan anlaşılmaz). */}
        {hasImages && !showFallback && (
          <span
            aria-hidden
            className={cn(
              "absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full bg-ink-900/70 px-2.5 py-1.5 text-[11px] font-medium text-paper-50 backdrop-blur-sm transition-opacity duration-200",
              imlecliCihaz ? "opacity-0 group-hover:opacity-100" : "opacity-90",
            )}
          >
            <MagnifyingGlassPlus size={13} weight="bold" />
            <span className="hidden sm:inline">Büyüt</span>
          </span>
        )}
      </button>

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
              aria-label={`${alt}, görsel ${i + 1}`}
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
                  alt={`${alt}, görsel ${i + 1}`}
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

      {lightbox && hasImages && (
        <GalleryLightbox
          images={images}
          alt={alt}
          index={active}
          onIndexChange={(i) => {
            prefetch(i);
            setActive(i);
          }}
          onClose={() => setLightbox(false)}
        />
      )}
    </div>
  );
}
