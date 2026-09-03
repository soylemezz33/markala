"use client";

import { useEffect, useRef } from "react";
import { create } from "zustand";
import { Warning, Question } from "@phosphor-icons/react";

/**
 * Panel onay penceresi (2026-09-03, Hasan: "iptal ederken gelen uyarı çok çirkin,
 * 2000'lerden kalma").
 *
 * Yerine geçtiği şey `window.confirm`: tarayıcının kendi kutusu, sayfanın ÜSTÜNDE
 * ortada belirir, panelin tipografisi/renkleri geçerli değildir, satır sonu dışında
 * biçimlendirme yoktur ve "Tamam/Vazgeç" etiketleri değiştirilemez — yıkıcı bir işlem
 * ile sıradan bir soru aynı görünür.
 *
 * API bilerek söz-tabanlı ve window.confirm ile birebir değiştirilebilir:
 *   if (!(await confirm({ title: "...", tone: "danger" }))) return;
 *
 * `bullets` window.confirm'deki "\n• ..." satırlarının yerini alır; `tone` yıkıcı işlemi
 * görsel olarak ayırır ve DANGER'da odak İPTAL düğmesine düşer (yanlışlıkla Enter'a
 * basan siparişi iptal etmesin).
 */

type ConfirmTone = "default" | "danger";

export interface ConfirmOptions {
  title: string;
  /** Başlığın altındaki açıklama paragrafı. */
  description?: string;
  /** Madde listesi — ne olacağını tek tek yazar (mail gidecek mi, geri alınabilir mi). */
  bullets?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

interface ConfirmStore {
  acik: ConfirmOptions | null;
  cevapla: ((sonuc: boolean) => void) | null;
  sor: (opts: ConfirmOptions) => Promise<boolean>;
  kapat: (sonuc: boolean) => void;
}

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  acik: null,
  cevapla: null,
  sor: (opts) =>
    new Promise<boolean>((resolve) => {
      // Üst üste iki soru: önceki "hayır" sayılıp kapanır, çağıran taraf asılı kalmaz.
      get().cevapla?.(false);
      set({ acik: opts, cevapla: resolve });
    }),
  kapat: (sonuc) => {
    get().cevapla?.(sonuc);
    set({ acik: null, cevapla: null });
  },
}));

/** window.confirm yerine: `if (!(await confirm({ title: "..." }))) return;` */
export function confirm(opts: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().sor(opts);
}

export function ConfirmDialog() {
  const acik = useConfirmStore((s) => s.acik);
  const kapat = useConfirmStore((s) => s.kapat);
  const onayRef = useRef<HTMLButtonElement>(null);
  const iptalRef = useRef<HTMLButtonElement>(null);
  const oncekiOdak = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!acik) return;
    // Pencere kapanınca odak, açan düğmeye geri dönsün (klavyeyle çalışan kaybolmasın).
    oncekiOdak.current = document.activeElement as HTMLElement | null;
    const tehlike = acik.tone === "danger";
    (tehlike ? iptalRef : onayRef).current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        kapat(false);
      }
      if (e.key === "Tab") {
        // İki düğme arasında basit odak hapsi — arkadaki sayfaya sekmeyle geçilmesin.
        const hedefler = [iptalRef.current, onayRef.current].filter(Boolean) as HTMLElement[];
        if (hedefler.length < 2) return;
        const sira = e.shiftKey ? [...hedefler].reverse() : hedefler;
        const i = sira.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        sira[(i + 1) % sira.length]!.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    // Arkadaki sayfa kaymasın.
    const eskiOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = eskiOverflow;
      oncekiOdak.current?.focus?.();
    };
  }, [acik, kapat]);

  if (!acik) return null;
  const tehlike = acik.tone === "danger";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="onay-baslik"
      aria-describedby={acik.description ? "onay-aciklama" : undefined}
    >
      {/* Arka plan — tıklayınca vazgeç (window.confirm'de bu bile yoktu). */}
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px] animate-overlay-in"
        onClick={() => kapat(false)}
      />
      <div className="relative w-full max-w-md rounded-xl bg-paper-50 shadow-2xl border border-paper-200 animate-dialog-in">
        <div className="p-5 flex gap-4">
          <div
            className={`shrink-0 w-10 h-10 rounded-full grid place-items-center ${
              tehlike ? "bg-error/10 text-error" : "bg-brand-500/12 text-brand-700"
            }`}
            aria-hidden="true"
          >
            {tehlike ? <Warning size={20} weight="fill" /> : <Question size={20} weight="fill" />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="onay-baslik" className="text-base font-semibold text-ink-900">
              {acik.title}
            </h2>
            {acik.description && (
              <p id="onay-aciklama" className="mt-1.5 text-sm text-ink-600 leading-relaxed">
                {acik.description}
              </p>
            )}
            {!!acik.bullets?.length && (
              <ul className="mt-3 space-y-1.5">
                {acik.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink-700 leading-relaxed">
                    <span className="text-ink-400 select-none" aria-hidden="true">
                      •
                    </span>
                    <span className="min-w-0">{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-paper-200 bg-paper-100/60 rounded-b-xl">
          <button
            ref={iptalRef}
            type="button"
            onClick={() => kapat(false)}
            className="px-3.5 py-2 rounded-md text-sm font-medium text-ink-700 bg-paper-50 border border-paper-200 hover:bg-paper-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            {acik.cancelLabel ?? "Vazgeç"}
          </button>
          <button
            ref={onayRef}
            type="button"
            onClick={() => kapat(true)}
            className={`px-3.5 py-2 rounded-md text-sm font-medium text-paper-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
              tehlike
                ? "bg-error hover:brightness-95 focus-visible:ring-error/50"
                : "bg-brand-600 hover:bg-brand-700 focus-visible:ring-brand-500/50"
            }`}
          >
            {acik.confirmLabel ?? "Devam et"}
          </button>
        </div>
      </div>
    </div>
  );
}
