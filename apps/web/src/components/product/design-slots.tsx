"use client";

import { useRef, useState } from "react";
import { cn } from "@markala/ui";
import { UploadSimple, SpinnerGap, WarningCircle, X, CopySimple, FileText } from "@phosphor-icons/react";

/**
 * Tasarım alanları (2026-09-03, Hasan madde 2+3).
 *
 * Sepete eklenen her SET için ayrı tasarım alanı: "1000 kartvizit × 2" → 2 alan; "2 bayrak" → 2 alan.
 * Her alan birden çok dosya alır (ön/arka yüz, ek görsel), dosya başına 50 MB. "Tüm tasarımlara
 * aynı dosyaları uygula" düğmesi 1. alanın dosyalarını diğerlerine kopyalar — aynı dosyayı üç kez
 * yüklemek zorunda kalmasın.
 *
 * HATA GÖRÜNÜRLÜĞÜ (madde 3): eskiden "Dosya çok büyük" mesajı iki uzun bilgi kutusunun ALTINDA
 * çıkıyordu ve gözden kaçıyordu. Artık hata ilgili alanın İÇİNDE, kırmızı çerçeveyle ve alan
 * görünür alana kaydırılarak gösterilir; uzun bilgi kutuları alanların altında kalır.
 *
 * Hem ürün sayfası (konfigüratör) hem sepet satırı bu bileşeni kullanır; yükleme /api/tasarim-yukle
 * üzerinden dosya dosya yapılır (her biri ayrı istek → 50 MB kontrolü dosya başına).
 */

export interface TasarimDosyasi {
  name: string;
  url: string;
  size: number;
  type?: string;
}
export interface TasarimSlotu {
  files: TasarimDosyasi[];
}

export const MAX_DOSYA_MB = 50;
export const MAX_SLOT = 20;
// WEBP eklendi (2026-09-04): müşteri dosyalarının önemli kısmı Canva/WhatsApp/telefon
// çıktısı olarak webp geliyordu ve reddedilince sipariş yarıda kalıyordu.
const ACCEPT = ".ai,.eps,.pdf,.cdr,.psd,.tif,.tiff,.jpg,.jpeg,.png,.webp";

export function slotlariNormalize(designs: TasarimSlotu[] | undefined, count: number): TasarimSlotu[] {
  const n = Math.max(1, Math.min(MAX_SLOT, Math.floor(count) || 1));
  const arr = (designs ?? []).slice(0, n).map((d) => ({ files: [...(d?.files ?? [])] }));
  while (arr.length < n) arr.push({ files: [] });
  return arr;
}

const boyut = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export function DesignSlots({
  count,
  designs,
  onChange,
  onUploadingChange,
  compact = false,
  idPrefix = "tasarim",
}: {
  /** Sepet set adedi = alan sayısı (1..20). */
  count: number;
  designs: TasarimSlotu[] | undefined;
  onChange: (next: TasarimSlotu[]) => void;
  /** Sürmekte olan yükleme sayısı değişince (sepete ekle / ödeme düğmeleri kilitlenir). */
  onUploadingChange?: (aktif: number) => void;
  /** Sepet satırında daha küçük görünüm. */
  compact?: boolean;
  idPrefix?: string;
}) {
  const slots = slotlariNormalize(designs, count);
  const [hata, setHata] = useState<Record<number, string | null>>({});
  const [yukleniyor, setYukleniyor] = useState<Record<number, number>>({});
  const aktifSayac = useRef(0);
  const kutuRef = useRef<Record<number, HTMLDivElement | null>>({});

  function hataGoster(i: number, mesaj: string | null) {
    setHata((h) => ({ ...h, [i]: mesaj }));
    if (mesaj) kutuRef.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function guncelle(i: number, files: TasarimDosyasi[]) {
    const next = slots.map((s, j) => (j === i ? { files } : s));
    onChange(next);
  }

  async function dosyaYukle(i: number, list: FileList | null) {
    if (!list || list.length === 0) return;
    const secilen = Array.from(list);
    const buyuk = secilen.find((f) => f.size > MAX_DOSYA_MB * 1024 * 1024);
    if (buyuk) {
      hataGoster(i, `"${buyuk.name}" çok büyük (${boyut(buyuk.size)}). Dosya başına en fazla ${MAX_DOSYA_MB} MB. Büyük dosyayı sipariş sonrası WhatsApp ile gönderebilirsiniz.`);
      return;
    }
    hataGoster(i, null);
    let eklenen: TasarimDosyasi[] = [];
    for (const file of secilen) {
      aktifSayac.current += 1;
      onUploadingChange?.(aktifSayac.current);
      setYukleniyor((y) => ({ ...y, [i]: (y[i] ?? 0) + 1 }));
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/tasarim-yukle", { method: "POST", body: form });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; fileName?: string; error?: string };
        if (!res.ok || !data.ok || !data.url) throw new Error(data.error || "Dosya yüklenemedi.");
        eklenen = [...eklenen, { name: data.fileName || file.name, url: data.url, size: file.size, type: file.type || undefined }];
        // Her dosya bittikçe listeye düşsün (üçüncü dosya beklenirken ilk ikisi görünür).
        guncelle(i, [...(slots[i]?.files ?? []), ...eklenen]);
      } catch (err) {
        hataGoster(i, `"${file.name}" yüklenemedi: ${err instanceof Error ? err.message : "tekrar deneyin"}.`);
      } finally {
        aktifSayac.current -= 1;
        onUploadingChange?.(aktifSayac.current);
        setYukleniyor((y) => ({ ...y, [i]: Math.max(0, (y[i] ?? 1) - 1) }));
      }
    }
  }

  function kaldir(i: number, url: string) {
    guncelle(i, (slots[i]?.files ?? []).filter((f) => f.url !== url));
  }

  function hepsineUygula() {
    const ilk = slots[0]?.files ?? [];
    if (ilk.length === 0) return;
    onChange(slots.map(() => ({ files: [...ilk] })));
  }

  const cokSlot = slots.length > 1;

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {cokSlot && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={cn("text-ink-700", compact ? "text-xs" : "text-sm")}>
            <strong className="text-ink-900">{slots.length} set</strong> sepette — her set için ayrı tasarım yükleyebilirsiniz.
          </p>
          <button
            type="button"
            onClick={hepsineUygula}
            disabled={(slots[0]?.files.length ?? 0) === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-paper-300 bg-paper-50 px-2.5 py-1.5 text-xs font-medium text-ink-900 hover:border-ink-500 disabled:opacity-50"
            title="1. tasarımın dosyalarını tüm setlere kopyalar"
          >
            <CopySimple size={14} /> Tüm setlerde aynı tasarımı kullan
          </button>
        </div>
      )}

      {slots.map((slot, i) => {
        const err = hata[i] ?? null;
        const busy = (yukleniyor[i] ?? 0) > 0;
        const inputId = `${idPrefix}-slot-${i}`;
        return (
          <div
            key={i}
            ref={(el) => { kutuRef.current[i] = el; }}
            className={cn(
              "rounded-md border-2 border-dashed transition-colors",
              err ? "border-error bg-error/5" : busy ? "border-paper-200 bg-paper-50" : "border-paper-200 hover:border-ink-300",
              compact ? "p-3" : "p-4",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className={cn("font-medium text-ink-900", compact ? "text-xs" : "text-sm")}>
                {cokSlot ? `Tasarım ${i + 1}` : "Tasarım dosyanız"}
                <span className="ml-1.5 text-xs font-normal text-ink-500">
                  {slot.files.length ? `${slot.files.length} dosya` : "AI, PDF, CDR, PSD, JPG, PNG, WEBP · dosya başına ≤ 50 MB"}
                </span>
              </span>
              <label
                htmlFor={inputId}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-ink-900 px-3 py-1.5 text-xs font-semibold text-paper-50 hover:bg-ink-700",
                  busy && "pointer-events-none opacity-60",
                )}
              >
                {busy ? <SpinnerGap size={14} className="animate-spin" /> : <UploadSimple size={14} />}
                {busy ? "Yükleniyor…" : slot.files.length ? "Dosya ekle" : "Dosya seç"}
              </label>
              <input
                id={inputId}
                type="file"
                multiple
                accept={ACCEPT}
                className="sr-only"
                disabled={busy}
                onChange={(e) => {
                  void dosyaYukle(i, e.target.files);
                  e.target.value = "";
                }}
                aria-label={`Tasarım ${i + 1} dosyalarını seçin (dosya başına en fazla ${MAX_DOSYA_MB} MB)`}
              />
            </div>

            {slot.files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {slot.files.map((f) => (
                  <li key={f.url} className="flex items-center gap-2 rounded bg-paper-50 px-2 py-1 text-xs text-ink-700">
                    <FileText size={14} className="flex-none text-ink-500" />
                    <span className="min-w-0 flex-1 truncate" title={f.name}>{f.name}</span>
                    <span className="flex-none text-ink-500">{boyut(f.size)}</span>
                    <button type="button" onClick={() => kaldir(i, f.url)} className="flex-none rounded p-0.5 text-ink-500 hover:text-error" aria-label={`${f.name} dosyasını kaldır`}>
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {err && (
              <p role="alert" aria-live="assertive" className="mt-2 flex items-start gap-2 rounded-md border border-error/30 bg-error/10 px-3 py-2 text-xs font-medium text-error">
                <WarningCircle size={16} weight="fill" className="mt-0.5 flex-none" />
                <span>{err}</span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
