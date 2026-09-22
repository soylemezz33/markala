"use client";

import { useEffect, useRef, useState } from "react";
import { Button, cn } from "@markala/ui";
import { X } from "@phosphor-icons/react";

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
 * SEÇ-SONRA-ONAYLA (2026-09-22 ikinci tur, Hasan): kartlar tek tıkla sepete
 * EKLEMEZ. Soldaki yuvarlak işaretlenir, kart markanın sarısına döner, sağdaki
 * "Devam et" ile onaylanır. Yanlış kutuya dokunan müşteri siparişini istemediği
 * bir işlemle kapatmıyor; seçimini görüp değiştirebiliyor.
 */

export type EkIslemSecenegi = { key: string; label: string; aciklama: string };

export function EkIslemHatirlatma({
  secenekler,
  onSec,
  onDevam,
  onKapat,
}: {
  secenekler: EkIslemSecenegi[];
  /** Seçilen işlemi uygula ve sepete ekle. */
  onSec: (optionKey: string) => void;
  /** Ek işlemsiz sepete ekle. */
  onDevam: () => void;
  onKapat: () => void;
}) {
  const kutuRef = useRef<HTMLDivElement>(null);
  const oncekiOdak = useRef<HTMLElement | null>(null);
  const [secili, setSecili] = useState<string | null>(null);

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

        <div className="px-5 pb-2 grid gap-2" role="radiogroup" aria-label="Ücretsiz kenar işlemleri">
          {secenekler.map((s) => {
            const isaretli = secili === s.key;
            return (
              <button
                key={s.key}
                type="button"
                role="radio"
                aria-checked={isaretli}
                onClick={() => setSecili(s.key)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500",
                  isaretli
                    ? "border-brand-500 bg-brand-100/40"
                    : "border-paper-200 bg-white hover:border-ink-300",
                )}
              >
                {/* Radyo yuvarlağı — işaretlenince markanın sarısıyla dolar. */}
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 shrink-0 grid place-items-center h-5 w-5 rounded-full border-2 transition",
                    isaretli ? "border-brand-500 bg-brand-500" : "border-paper-200 bg-white",
                  )}
                >
                  {isaretli && <span className="h-2 w-2 rounded-full bg-ink-900" />}
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

        {/* Solda işlemsiz çıkış, sağda seçimi onaylayan asıl düğme. Seçim yapılmadan
            "Devam et" anlamsız olur → işaretlenene kadar kapalı. */}
        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-paper-200 mt-2">
          <button
            type="button"
            onClick={onDevam}
            className="text-sm text-ink-600 underline underline-offset-4 hover:text-ink-900 py-1 self-start sm:self-auto"
          >
            Ek işlemsiz devam et
          </button>
          <Button
            onClick={() => secili && onSec(secili)}
            disabled={!secili}
            className="w-full sm:w-auto"
          >
            Devam et
          </Button>
        </div>
      </div>
    </div>
  );
}
