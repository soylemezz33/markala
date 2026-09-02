"use client";

import { useRef, useState } from "react";
import { UploadSimple, CircleNotch, Image as ImageIcon, FileText, FilePdf } from "@phosphor-icons/react";
import { toast } from "./toast";

/**
 * Sipariş SATIRINA tasarımcı dosyası yükleme (2026-09-02, üretim ARGE Faz 2).
 *
 * Neden var: tasarımı Markala'nın yaptığı siparişlerde bitmiş dosya sisteme hiç girmiyordu;
 * üretimde "hangi bayrak kimin" karışıklığının kök nedeni buydu. Tasarımcı Drive'a elle
 * girmek yerine buradan yükler — tek yer, sipariş numarasıyla otomatik eşleşir.
 *
 * Üç tür (API ile aynı liste, orders.dto.ts DESIGN_KINDS):
 *   onizleme — küçük RGB JPG/PNG (≤ 2 MB). Panelde her kartta gösterilecek; ASIL tanıma aracı.
 *   calisma  — AI/PSD/CDR/EPS/TIF çalışma dosyası (≤ 50 MB)
 *   baski    — baskıya hazır PDF (≤ 50 MB)
 *
 * image-uploader.tsx desenleri (gizli input, sürükle-bırak, busy, toast) yeniden kullanıldı;
 * o bileşen public görsel ve /api/uploads'a bağlı olduğu için doğrudan kullanılamadı.
 */

export type DesignKind = "onizleme" | "calisma" | "baski";

const KINDS: Array<{ id: DesignKind; label: string; hint: string; accept: string; max: number; Icon: typeof ImageIcon }> = [
  { id: "onizleme", label: "Önizleme", hint: "JPG/PNG · RGB · ≤ 2 MB", accept: ".jpg,.jpeg,.png", max: 2 * 1024 * 1024, Icon: ImageIcon },
  { id: "calisma", label: "Çalışma dosyası", hint: "AI · PSD · CDR · EPS · TIF · ≤ 50 MB", accept: ".ai,.psd,.cdr,.eps,.tif,.tiff,.pdf,.jpg,.jpeg,.png", max: 50 * 1024 * 1024, Icon: FileText },
  { id: "baski", label: "Baskıya hazır PDF", hint: "PDF · CMYK · taşma paylı · ≤ 50 MB", accept: ".pdf", max: 50 * 1024 * 1024, Icon: FilePdf },
];

export function DesignFileUploader({
  orderId,
  itemId,
  onDone,
}: {
  orderId: string;
  itemId: string;
  onDone: () => void;
}) {
  const [kind, setKind] = useState<DesignKind>("onizleme");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const secili = KINDS.find((k) => k.id === kind)!;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    // İstemci ön-kontrol — 50 MB'ı sunucuya taşıyıp 400 almak yerine burada kes. Otorite API.
    if (file.size > secili.max) {
      toast.error(`${secili.label} en fazla ${Math.round(secili.max / 1024 / 1024)} MB olabilir.`);
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const res = await fetch(`/api/siparis-tasarim/${orderId}/${itemId}`, { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Dosya yüklenemedi.");
      toast.success(`${secili.label} eklendi.`);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Dosya yüklenemedi.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-dashed border-paper-200 bg-paper-50 p-3">
      {/* Tür seçici — yüklemeden ÖNCE seçilir; accept ve boyut sınırı buna göre değişir. */}
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Dosya türü">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            role="radio"
            aria-checked={kind === k.id}
            onClick={() => setKind(k.id)}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              kind === k.id
                ? "bg-ink-900 text-paper-50 border-ink-900"
                : "border-paper-200 text-ink-700 hover:border-ink-300 hover:bg-paper-100"
            }`}
          >
            <k.Icon size={13} weight={kind === k.id ? "fill" : "regular"} />
            {k.label}
          </button>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={secili.accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        disabled={busy}
        className={`mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-md border-2 border-dashed text-xs transition-colors disabled:opacity-60 ${
          drag
            ? "border-brand-500 bg-brand-50 text-brand-700"
            : "border-paper-200 text-ink-500 hover:border-ink-300 hover:bg-paper-100"
        }`}
      >
        {busy ? (
          <>
            <CircleNotch size={16} className="animate-spin" /> Yükleniyor…
          </>
        ) : (
          <>
            <UploadSimple size={16} />
            <span>
              <strong className="font-semibold text-ink-700">{secili.label}</strong> seç veya sürükle-bırak
              <span className="ml-1.5 text-[10px] text-ink-400">{secili.hint}</span>
            </span>
          </>
        )}
      </button>
    </div>
  );
}
