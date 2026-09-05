"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@markala/ui";
import {
  X,
  CaretLeft,
  CaretRight,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
} from "@phosphor-icons/react";

/**
 * Ürün görseli tam ekran inceleme (2026-09-05, Hasan: "görselin üstüne gelince zoom
 * yapmıyor, tıklayınca açılmıyor").
 *
 * TASARIM KARARLARI
 * - Yalnız AÇIKKEN monte edilir. Kapalıyken sayfaya tek bir DOM düğümü bile eklemez;
 *   ürün sayfasının ilk boyaması ve LCP'si etkilenmez.
 * - Harici kütüphane YOK. Hazır bir lightbox paketi 30-60 KB getirirdi; burada gereken
 *   şey birkaç yüz satır — ürün sayfası zaten LCP'ye duyarlı (bkz. gallery.tsx başlığı).
 * - Görseller galeriyle AYNI URL'leri kullanır; galeri onları çoktan ön-yüklediği için
 *   pencere açılırken çoğunlukla yeni ağ isteği hiç olmaz.
 * - Yakınlaştırma tıklamayla açılıp kapanır ve tıklanan noktayı merkez alır; basılı
 *   tutup sürükleyerek gezinilir. Mobilde tarayıcının kendi kıstırma hareketi de çalışır.
 * - Hareket azaltma tercihi globals.css'teki genel koruma ile karşılanıyor.
 */
export function GalleryLightbox({
  images,
  alt,
  index,
  onIndexChange,
  onClose,
}: {
  images: string[];
  alt: string;
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(false);
  /** Yakınlaştırma merkezi (yüzde) — tıklanan nokta sabit kalsın diye. */
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const kapatRef = useRef<HTMLButtonElement>(null);
  const oncekiOdak = useRef<HTMLElement | null>(null);
  const dokunusX = useRef<number | null>(null);

  const cokluGorsel = images.length > 1;

  const git = useCallback(
    (yon: 1 | -1) => {
      if (!cokluGorsel) return;
      setZoom(false);
      onIndexChange((index + yon + images.length) % images.length);
    },
    [cokluGorsel, images.length, index, onIndexChange],
  );

  // Klavye: Esc kapatır, ok tuşları gezinir. Açıkken sayfa kaydırması kilitlenir,
  // kapanınca odak pencereyi açan düğmeye geri döner.
  useEffect(() => {
    oncekiOdak.current = document.activeElement as HTMLElement | null;
    kapatRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        git(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        git(-1);
      }
    };
    document.addEventListener("keydown", onKey);
    const eskiOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = eskiOverflow;
      oncekiOdak.current?.focus?.();
    };
  }, [git, onClose]);

  /** Tıklanan noktayı merkez alarak yakınlaştır / uzaklaştır. */
  function yakinlastir(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
    setZoom((v) => !v);
  }

  /** Yakınlaştırılmışken basılı tutup sürükleyerek gezinme. */
  function surukle(e: React.MouseEvent<HTMLDivElement>) {
    if (!zoom || e.buttons !== 1) return;
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-ink-900/95 backdrop-blur-sm animate-overlay-in"
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} — görsel ${index + 1} / ${images.length}`}
    >
      {/* Üst çubuk: sayaç + araçlar. Görseli örtmesin diye ince tutuldu. */}
      <div className="flex-none flex items-center justify-between px-4 py-3 text-paper-50">
        <span className="text-sm tabular-nums opacity-80">
          {cokluGorsel ? `${index + 1} / ${images.length}` : ""}
        </span>
        <div className="flex items-center gap-1">
          <span className="hidden sm:inline text-xs opacity-60 mr-2">
            {zoom ? "Uzaklaştırmak için tıkla" : "Yakınlaştırmak için görsele tıkla"}
          </span>
          <button
            type="button"
            onClick={() => setZoom((v) => !v)}
            aria-label={zoom ? "Uzaklaştır" : "Yakınlaştır"}
            className="p-2 rounded-full hover:bg-paper-50/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-50/60"
          >
            {zoom ? <MagnifyingGlassMinus size={20} /> : <MagnifyingGlassPlus size={20} />}
          </button>
          <button
            ref={kapatRef}
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="p-2 rounded-full hover:bg-paper-50/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-50/60"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Görsel alanı: boş alana tıklamak kapatır, görselin kendisi yakınlaştırır. */}
      <div
        className="relative flex-1 min-h-0"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        onTouchStart={(e) => {
          dokunusX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const bas = dokunusX.current;
          dokunusX.current = null;
          const son = e.changedTouches[0]?.clientX;
          if (bas == null || son == null || zoom) return;
          const fark = son - bas;
          if (Math.abs(fark) > 50) git(fark < 0 ? 1 : -1); // sola kaydır → sonraki
        }}
      >
        <div
          className={cn(
            "absolute inset-0 m-auto max-w-[min(1200px,94vw)] overflow-hidden",
            zoom ? "cursor-zoom-out" : "cursor-zoom-in",
          )}
          onClick={yakinlastir}
          onMouseMove={surukle}
        >
          <Image
            key={images[index]}
            src={images[index]!}
            alt={`${alt} — görsel ${index + 1}`}
            fill
            sizes="(min-width:1024px) 1200px, 100vw"
            className="object-contain transition-transform duration-300 ease-out select-none"
            style={{
              transform: zoom ? "scale(2.4)" : "scale(1)",
              transformOrigin: `${origin.x}% ${origin.y}%`,
            }}
            draggable={false}
            priority
          />
        </div>

        {cokluGorsel && (
          <>
            <button
              type="button"
              onClick={() => git(-1)}
              aria-label="Önceki görsel"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-ink-900/40 text-paper-50 hover:bg-ink-900/70 backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-50/60"
            >
              <CaretLeft size={22} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => git(1)}
              aria-label="Sonraki görsel"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-ink-900/40 text-paper-50 hover:bg-ink-900/70 backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-50/60"
            >
              <CaretRight size={22} weight="bold" />
            </button>
          </>
        )}
      </div>

      {/* Alt şerit: küçük görseller. Tek görselde hiç basılmaz. */}
      {cokluGorsel && (
        <div className="flex-none px-4 py-3">
          <div className="flex gap-2 justify-center overflow-x-auto">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => {
                  setZoom(false);
                  onIndexChange(i);
                }}
                aria-label={`Görsel ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "relative flex-none h-14 w-14 rounded-md overflow-hidden bg-paper-50/10 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-50/60",
                  i === index ? "ring-2 ring-paper-50 opacity-100" : "opacity-50 hover:opacity-90",
                )}
              >
                <Image src={src} alt="" fill sizes="56px" className="object-contain" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
