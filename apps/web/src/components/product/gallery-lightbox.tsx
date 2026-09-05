"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@markala/ui";
import { X, CaretLeft, CaretRight } from "@phosphor-icons/react";

/**
 * Ürün görseli tam ekran inceleme.
 *
 * 2026-09-05 — İKİNCİ TUR. İlk sürüm "standart lightbox"tı ve Hasan haklı olarak
 * "tıklayınca büyümüyor bile" dedi. Sebep ölçülebilir bir tasarım hatasıydı:
 * masaüstünde imleç büyüteci görseli zaten 1.9x (≈866 px) gösteriyor, açılan pencere
 * ise ≈840 px veriyordu. Yani tıklamanın GÖRÜNÜR bir karşılığı yoktu ve geçiş de
 * anlıktı — hiçbir şey olmamış gibi duruyordu.
 *
 * Bu sürümde üç şey değişti:
 * 1) MORF GEÇİŞ: görsel bulunduğu kutudan büyüyerek tam ekrana akar, kapanırken geri
 *    döner (FLIP: başlangıç ve bitiş dikdörtgenleri ölçülür, aradaki fark tek bir
 *    transform ile canlandırılır — kütüphane yok, düzen yeniden hesaplanmaz).
 * 2) GERÇEKTEN BÜYÜK: üst çubuk ve küçük görsel şeridi artık yer kaplamıyor, görselin
 *    ÜSTÜNE biniyor. Görsel neredeyse tüm ekranı kullanıyor.
 * 3) GERÇEK İNCELEME: tekerlekle imleç etrafında kademesiz yakınlaştırma (1x–4x),
 *    sürükleyerek gezinme, çift tıkla sıfırlama.
 */

/** Yakınlaştırma sınırları — 4x baskı dosyasında dokuyu görmeye yeter, daha fazlası bulanıklaşır. */
const MIN_OLCEK = 1;
const MAX_OLCEK = 4;

type Donusum = { olcek: number; x: number; y: number };
const SIFIR: Donusum = { olcek: 1, x: 0, y: 0 };

export function GalleryLightbox({
  images,
  alt,
  index,
  sourceRect,
  onIndexChange,
  onClose,
}: {
  images: string[];
  alt: string;
  index: number;
  /** Tıklanan galeri kutusunun ekrandaki yeri — morf geçişin başlangıcı. */
  sourceRect: DOMRect | null;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const [acildi, setAcildi] = useState(false);
  const [kapaniyor, setKapaniyor] = useState(false);
  const [d, setD] = useState<Donusum>(SIFIR);
  const sahneRef = useRef<HTMLDivElement>(null);
  const kapatRef = useRef<HTMLButtonElement>(null);
  const oncekiOdak = useRef<HTMLElement | null>(null);
  const dokunus = useRef<{ x: number; y: number } | null>(null);
  const surukleme = useRef<{ x: number; y: number; bx: number; by: number } | null>(null);

  const cokluGorsel = images.length > 1;

  /** Morf: başlangıç dikdörtgeninden bitişe götüren transform. */
  const [morf, setMorf] = useState<string | null>(null);

  useLayoutEffect(() => {
    const sahne = sahneRef.current;
    if (!sahne || !sourceRect) {
      setAcildi(true);
      return;
    }
    const bitis = sahne.getBoundingClientRect();
    const sx = sourceRect.width / bitis.width;
    const sy = sourceRect.height / bitis.height;
    const dx = sourceRect.left + sourceRect.width / 2 - (bitis.left + bitis.width / 2);
    const dy = sourceRect.top + sourceRect.height / 2 - (bitis.top + bitis.height / 2);
    // Önce kutunun yerine ve boyutuna koy, sonraki karede kimliğe (tam ekrana) sal.
    setMorf(`translate(${dx}px, ${dy}px) scale(${Math.min(sx, sy)})`);
    const id = requestAnimationFrame(() => {
      setMorf(null);
      setAcildi(true);
    });
    return () => cancelAnimationFrame(id);
  }, [sourceRect]);

  /** Kapanış da morf: görsel geldiği kutuya geri akar, sonra bileşen sökülür. */
  const kapat = useCallback(() => {
    const sahne = sahneRef.current;
    if (!sahne || !sourceRect || kapaniyor) {
      onClose();
      return;
    }
    const bitis = sahne.getBoundingClientRect();
    const sx = sourceRect.width / bitis.width;
    const sy = sourceRect.height / bitis.height;
    const dx = sourceRect.left + sourceRect.width / 2 - (bitis.left + bitis.width / 2);
    const dy = sourceRect.top + sourceRect.height / 2 - (bitis.top + bitis.height / 2);
    setD(SIFIR);
    setKapaniyor(true);
    setMorf(`translate(${dx}px, ${dy}px) scale(${Math.min(sx, sy)})`);
    window.setTimeout(onClose, 240);
  }, [kapaniyor, onClose, sourceRect]);

  const git = useCallback(
    (yon: 1 | -1) => {
      if (!cokluGorsel) return;
      setD(SIFIR);
      onIndexChange((index + yon + images.length) % images.length);
    },
    [cokluGorsel, images.length, index, onIndexChange],
  );

  useEffect(() => {
    oncekiOdak.current = document.activeElement as HTMLElement | null;
    kapatRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); kapat(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); git(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); git(-1); }
    };
    document.addEventListener("keydown", onKey);
    const eskiOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = eskiOverflow;
      oncekiOdak.current?.focus?.();
    };
  }, [git, kapat]);

  /**
   * Tekerlekle yakınlaştırma — imlecin altındaki nokta SABİT kalır.
   * Ekran koordinatını görsel uzayına çevirip yeni ölçekte geri koyuyoruz.
   */
  function tekerlek(e: React.WheelEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left - r.width / 2;
    const py = e.clientY - r.top - r.height / 2;
    setD((v) => {
      const yeni = Math.min(MAX_OLCEK, Math.max(MIN_OLCEK, v.olcek * (e.deltaY < 0 ? 1.18 : 1 / 1.18)));
      if (yeni === MIN_OLCEK) return SIFIR;
      return {
        olcek: yeni,
        x: px - ((px - v.x) / v.olcek) * yeni,
        y: py - ((py - v.y) / v.olcek) * yeni,
      };
    });
  }

  function basla(e: React.PointerEvent<HTMLDivElement>) {
    if (d.olcek === 1) return;
    surukleme.current = { x: e.clientX, y: e.clientY, bx: d.x, by: d.y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }
  function hareket(e: React.PointerEvent<HTMLDivElement>) {
    const s = surukleme.current;
    if (!s) return;
    setD((v) => ({ ...v, x: s.bx + (e.clientX - s.x), y: s.by + (e.clientY - s.y) }));
  }
  function bitir() {
    surukleme.current = null;
  }

  const yakin = d.olcek > 1;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] transition-opacity duration-200",
        acildi && !kapaniyor ? "opacity-100" : "opacity-0",
      )}
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} — görsel ${index + 1} / ${images.length}`}
    >
      {/* Zemin: sayfayı yumuşakça siler, boş alana tıklamak kapatır. */}
      <div className="absolute inset-0 bg-ink-900/92 backdrop-blur-md" onClick={kapat} />

      {/* Sahne: görselin morf ile aktığı alan. Üst çubuk ve şerit ÜSTÜNE biner,
          yer kaplamaz → görsel neredeyse tüm ekranı kullanır. */}
      <div
        ref={sahneRef}
        className={cn(
          "absolute inset-x-0 top-0 bottom-0 mx-auto max-w-[min(1500px,96vw)] overflow-hidden will-change-transform",
          yakin ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
        )}
        /**
         * GEÇİŞ HER ZAMAN TANIMLI, yalnız transform değişir.
         * İlk denemede transition ile yeni transform AYNI karede veriliyordu; tarayıcı
         * ikisini tek düzen hesabında birleştirip animasyonu hiç oynatmıyordu (ölçtüm:
         * tıklamadan 120 ms sonra görsel çoktan son hâlindeydi). FLIP'in klasik tuzağı.
         */
        style={{
          transform: morf ?? "none",
          transition: "transform 320ms cubic-bezier(0.16,1,0.3,1)",
        }}
        onWheel={tekerlek}
        onPointerDown={basla}
        onPointerMove={hareket}
        onPointerUp={bitir}
        onPointerCancel={bitir}
        onDoubleClick={() => setD(SIFIR)}
        onClick={(e) => {
          // Görselin DIŞINDAKİ boşluğa tıklama kapatır; görselin kendisi yakınlaştırır.
          if (e.target === e.currentTarget) kapat();
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          dokunus.current = t ? { x: t.clientX, y: t.clientY } : null;
        }}
        onTouchEnd={(e) => {
          const bas = dokunus.current;
          dokunus.current = null;
          const t = e.changedTouches[0];
          if (!bas || !t || yakin) return;
          const fx = t.clientX - bas.x;
          if (Math.abs(fx) > 60 && Math.abs(fx) > Math.abs(t.clientY - bas.y)) git(fx < 0 ? 1 : -1);
        }}
      >
        {/*
          Nefes payı BURADA (inset-*), sahnenin padding'inde DEĞİL: mutlak konumlu bir
          çocuk kapsayıcının padding kutusuna göre yerleşir, yani sahneye verilen padding
          bu katmanı hiç içeri almıyordu (ölçtüm: görsel alanı sahneyle birebir aynıydı).
        */}
        <div
          className="absolute inset-3 sm:inset-6 md:inset-10"
          style={{
            transform: `translate(${d.x}px, ${d.y}px) scale(${d.olcek})`,
            transition: surukleme.current ? undefined : "transform 180ms ease-out",
          }}
        >
          <Image
            key={images[index]}
            src={images[index]!}
            alt={`${alt} — görsel ${index + 1}`}
            fill
            sizes="(min-width:1024px) 1500px, 100vw"
            className="object-contain select-none"
            draggable={false}
            priority
          />
        </div>
      </div>

      {/* Üst şerit: sayaç + kapat. Görselin üstünde yüzer. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 text-paper-50">
        <span className="text-sm tabular-nums rounded-full bg-ink-900/50 px-3 py-1 backdrop-blur-sm">
          {cokluGorsel ? `${index + 1} / ${images.length}` : alt}
        </span>
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="hidden md:inline rounded-full bg-ink-900/50 px-3 py-1 text-xs backdrop-blur-sm">
            {yakin ? `%${Math.round(d.olcek * 100)} · sürükleyerek gez, çift tıkla sıfırla` : "Tekerlekle yakınlaştır"}
          </span>
          <button
            ref={kapatRef}
            type="button"
            onClick={kapat}
            aria-label="Kapat"
            className="rounded-full bg-ink-900/50 p-2.5 backdrop-blur-sm hover:bg-ink-900/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-50/60"
          >
            <X size={20} weight="bold" />
          </button>
        </div>
      </div>

      {cokluGorsel && (
        <>
          <button
            type="button"
            onClick={git.bind(null, -1)}
            aria-label="Önceki görsel"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-ink-900/50 p-3 text-paper-50 backdrop-blur-sm hover:bg-ink-900/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-50/60"
          >
            <CaretLeft size={22} weight="bold" />
          </button>
          <button
            type="button"
            onClick={git.bind(null, 1)}
            aria-label="Sonraki görsel"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-ink-900/50 p-3 text-paper-50 backdrop-blur-sm hover:bg-ink-900/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-50/60"
          >
            <CaretRight size={22} weight="bold" />
          </button>

          {/* Alt şerit: görselin üstünde yüzer, arkasında yumuşak karartma. */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/80 to-transparent pt-10 pb-4">
            <div className="flex justify-center gap-2 px-4 overflow-x-auto">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => {
                    setD(SIFIR);
                    onIndexChange(i);
                  }}
                  aria-label={`Görsel ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    "relative h-14 w-14 flex-none overflow-hidden rounded-lg bg-paper-50/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-50/60",
                    i === index
                      ? "ring-2 ring-paper-50 opacity-100 scale-105"
                      : "opacity-45 hover:opacity-90",
                  )}
                >
                  <Image src={src} alt="" fill sizes="56px" className="object-contain" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
