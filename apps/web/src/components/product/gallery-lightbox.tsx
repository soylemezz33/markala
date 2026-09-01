"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import { cn } from "@markala/ui";
import { ProductImageFallback } from "@/components/product/product-image-fallback";
import type { ResolvedImage } from "@/lib/product-image";

/**
 * Galeri lightbox'ı (AJA-386).
 *
 * Erişilebilir modal: `role=dialog` + `aria-modal`, focus-trap (Tab döngüsü), Esc ile kapanır,
 * açılınca gövde scroll'u kilitlenir ve odak tetikleyiciye geri döner. Klavye ok tuşları ve
 * dokunmatik swipe ile gezinilir; görsele tıklama zoom'u açar/kapatır.
 */
export function GalleryLightbox({
  images,
  srcOverride,
  initialIndex,
  onIndexChange,
  onClose,
  onError,
  deadSet,
}: {
  images: ResolvedImage[];
  srcOverride: Record<number, string>;
  initialIndex: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  onError: (i: number, img: ResolvedImage) => void;
  deadSet: Set<number>;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const count = images.length;

  const go = useCallback(
    (i: number) => {
      const next = (i + count) % count;
      setZoomed(false);
      setIndex(next);
      onIndexChange(next);
    },
    [count, onIndexChange],
  );

  // Açılışta odağı modala al, gövde scroll'unu kilitle, kapanışta tetikleyiciye geri dön.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Klavye: Esc kapat, ← → gez, Tab focus-trap.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "Tab") {
        const container = dialogRef.current;
        if (!container) return;
        const focusable = container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        const activeEl = document.activeElement as HTMLElement | null;
        if (e.shiftKey && activeEl === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && activeEl === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, go, onClose]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null || zoomed) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
  }

  const img = images[index];
  if (!img) return null;
  const src = srcOverride[index] ?? img.src;

  const node = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${img.alt} — görsel ${index + 1} / ${count}`}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex flex-col bg-ink-900/95 outline-none"
      onClick={(e) => {
        // Arka plana (görsel dışı) tıklama kapatır.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Üst çubuk: sayaç + kapat */}
      <div className="flex items-center justify-between px-4 py-3 text-paper-50">
        <span className="text-sm tabular-nums text-paper-50/80">
          {index + 1} / {count}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="rounded-md p-2 hover:bg-paper-50/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper-50"
        >
          <X size={24} weight="bold" />
        </button>
      </div>

      {/* Ana görsel alanı */}
      <div
        className="relative flex-1 flex items-center justify-center px-4 pb-4 select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {count > 1 && (
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Önceki görsel"
            className="absolute left-2 z-10 rounded-full bg-paper-50/10 p-2 text-paper-50 hover:bg-paper-50/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper-50 md:left-6"
          >
            <CaretLeft size={28} weight="bold" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setZoomed((z) => !z)}
          aria-label={zoomed ? "Uzaklaştır" : "Yakınlaştır"}
          className={cn(
            "relative h-full w-full max-w-4xl mx-auto transition-transform duration-200",
            zoomed ? "cursor-zoom-out overflow-auto" : "cursor-zoom-in",
          )}
        >
          {deadSet.has(index) ? (
            <ProductImageFallback name={img.alt} />
          ) : (
            <Image
              src={src}
              alt={img.alt}
              fill
              sizes="(min-width:768px) 896px, 100vw"
              placeholder={img.blurDataURL ? "blur" : undefined}
              blurDataURL={img.blurDataURL}
              className={cn(
                "object-contain transition-transform duration-200",
                zoomed && "scale-[1.8]",
              )}
              onError={() => onError(index, img)}
            />
          )}
        </button>

        {count > 1 && (
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Sonraki görsel"
            className="absolute right-2 z-10 rounded-full bg-paper-50/10 p-2 text-paper-50 hover:bg-paper-50/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper-50 md:right-6"
          >
            <CaretRight size={28} weight="bold" />
          </button>
        )}
      </div>

      {/* Alt thumbnail şeridi */}
      {count > 1 && (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 py-3">
          {images.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Görsel ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "relative h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 bg-paper-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper-50",
                i === index
                  ? "border-brand-500"
                  : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              {deadSet.has(i) ? (
                <ProductImageFallback />
              ) : (
                <Image
                  src={srcOverride[i] ?? t.src}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-contain"
                  onError={() => onError(i, t)}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(node, document.body);
}
