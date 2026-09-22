"use client";

import { useEffect, useRef } from "react";
import { Button } from "@markala/ui";
import { X, Scissors, Circle, Rows } from "@phosphor-icons/react";

/**
 * BRANDA EK İŞLEM HATIRLATMASI (2026-09-22, Hasan).
 *
 * Branda ailesinde kenar işlemi ÜCRETSİZ ama varsayılan "Yok". Müşteri farkında
 * olmadan işlemsiz sipariş veriyor; branda eline delik/tünelsiz geliyor ve asamıyor.
 * Bu yüzden sepete eklerken bir kez soruyoruz — ücretli bir satış değil, montajı
 * mümkün kılan bir hatırlatma.
 *
 * SADECE branda ailesinde çıkar: tetikleyici, ek işlem grubunda "germe" seçeneğinin
 * bulunmasıdır. Folyo (laminasyon/iç mekân) ve dekota (CNC kesim) ek işlemleri
 * ÜCRETLİ; orada böyle bir uyarı satış baskısı olurdu.
 *
 * Müşteriyi kilitlemez: "İşlemsiz devam et" her zaman açık ve aynı ağırlıkta durur.
 */

export type EkIslemSecenegi = { key: string; label: string; aciklama: string };

/** Seçenek anahtarına göre ikon — görsel ayırt edicilik, anlam taşımaz. */
const IKON: Record<string, typeof Scissors> = {
  germe: Rows,
  "dikis-kopca": Circle,
  "kolon-dikis": Scissors,
};

export function EkIslemHatirlatma({
  secenekler,
  onSec,
  onDevam,
  onKapat,
}: {
  secenekler: EkIslemSecenegi[];
  /** Seçeneği işaretle ve sepete ekle. */
  onSec: (optionKey: string) => void;
  /** Ek işlemsiz sepete ekle. */
  onDevam: () => void;
  onKapat: () => void;
}) {
  const kutuRef = useRef<HTMLDivElement>(null);
  const oncekiOdak = useRef<HTMLElement | null>(null);

  useEffect(() => {
    oncekiOdak.current = document.activeElement as HTMLElement | null;
    kutuRef.current?.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onKapat();
    };
    document.addEventListener("keydown", esc);
    const eskiOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = eskiOverflow;
      oncekiOdak.current?.focus?.();
    };
  }, [onKapat]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-ink-900/50 backdrop-blur-[2px] p-0 sm:p-4"
      onClick={onKapat}
      role="presentation"
    >
      <div
        ref={kutuRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ek-islem-baslik"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl outline-none max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
          <div>
            <h2 id="ek-islem-baslik" className="text-lg font-semibold text-ink-900">
              Ücretsiz kenar işlemi eklemek ister misiniz?
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              Hiçbiri seçilmedi. Kenar işlemi olmadan branda düz kesilir; asmak için
              delik veya tünel bulunmaz.
            </p>
          </div>
          <button
            type="button"
            onClick={onKapat}
            aria-label="Kapat"
            className="shrink-0 rounded-md p-1.5 text-ink-500 hover:bg-paper-100 hover:text-ink-900"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="px-5 pb-2 grid gap-2">
          {secenekler.map((s) => {
            const Ikon = IKON[s.key] ?? Scissors;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => onSec(s.key)}
                className="group flex items-start gap-3 rounded-xl border border-paper-200 bg-white p-3.5 text-left transition hover:border-brand-500 hover:bg-brand-100/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                <span className="mt-0.5 shrink-0 rounded-lg bg-paper-100 p-2 text-ink-700 group-hover:bg-brand-500 group-hover:text-ink-900">
                  <Ikon size={18} weight="bold" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-ink-900">{s.label}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      Ücretsiz
                    </span>
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-600">{s.aciklama}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-5 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-paper-200 mt-2">
          <button
            type="button"
            onClick={onDevam}
            className="text-sm text-ink-600 underline underline-offset-4 hover:text-ink-900 py-1"
          >
            İşlemsiz devam et
          </button>
          <Button variant="outline" onClick={onKapat}>
            Seçeneklere dön
          </Button>
        </div>
      </div>
    </div>
  );
}
