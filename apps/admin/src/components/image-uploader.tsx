"use client";

import { useRef, useState } from "react";
import {
  UploadSimple,
  X,
  CircleNotch,
  ImageSquare,
  CaretLeft,
  CaretRight,
  DotsSixVertical,
} from "@phosphor-icons/react";
import { toast } from "./toast";

const ACCEPT = "image/jpeg,image/png,image/webp";

/** Görseli BFF route'una yükler, public URL döner. Hata → throw (çağıran toast gösterir). */
async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: fd });
  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    message?: string;
  };
  if (!res.ok || !data.url) {
    throw new Error(data.message ?? "Görsel yüklenemedi.");
  }
  return data.url;
}

/** Seed verisindeki göreli yollar markala.com.tr'ye, yeni upload'lar mutlak URL olduğu için olduğu gibi. */
function resolveImg(src: string): string {
  if (!src) return src;
  return src.startsWith("http") ||
    src.startsWith("/api") ||
    src.startsWith("blob:")
    ? src
    : `https://markala.com.tr${src}`;
}

/**
 * Tek görsel — banner / slider / blog.
 * Controlled: `value` mevcut URL, yükleme sonrası `onChange(url)` çağrılır.
 */
export function ImageUploader({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
      toast.success("Görsel yüklendi.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Görsel yüklenemedi.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveImg(value)}
            alt="Görsel önizleme"
            className="w-full max-h-48 object-contain rounded-md border border-paper-200 bg-paper-100"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100 disabled:opacity-60"
            >
              {busy ? (
                <CircleNotch size={14} className="animate-spin" />
              ) : (
                <UploadSimple size={14} />
              )}
              Değiştir
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-error/30 text-error hover:bg-error/10 disabled:opacity-60"
            >
              <X size={14} /> Kaldır
            </button>
          </div>
        </div>
      ) : (
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
          className={`w-full flex flex-col items-center justify-center gap-2 py-8 rounded-md border-2 border-dashed text-xs transition-colors ${
            drag
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-paper-200 text-ink-500 hover:border-ink-300 hover:bg-paper-100"
          }`}
        >
          {busy ? (
            <>
              <CircleNotch size={22} className="animate-spin" /> Yükleniyor…
            </>
          ) : (
            <>
              <ImageSquare size={22} />
              Görsel seç veya sürükle-bırak
              <span className="text-[10px] text-ink-400">
                JPG · PNG · WEBP · max 5MB
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Çoklu görsel — ürün galerisi. İlk görsel kapak.
 * Controlled: `value` URL dizisi, ekle/sil sonrası `onChange(urls)`.
 */
export function ImageGallery({
  value,
  onChange,
  max = 6,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Sürükleyerek sıralama (2026-09-01, Hasan): kapak = dizinin İLK elemanı, o yüzden
  // sıralamayı değiştirmek kapağı değiştirmenin doğal yolu — ayrı "kapak seç" alanı yok.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  /** Çoklu yüklemede "3/8" göstergesi; tek dosyada null. */
  const [sira, setSira] = useState<{ simdi: number; toplam: number } | null>(null);

  /** i konumundaki görseli j'ye taşır (araya sokar, yer değiştirmez). */
  function reorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= value.length || to >= value.length) return;
    const next = [...value];
    const [tasinan] = next.splice(from, 1);
    if (tasinan === undefined) return;
    next.splice(to, 0, tasinan);
    onChange(next);
  }

  function dragBitti() {
    setDragIndex(null);
    setOverIndex(null);
  }

  /**
   * ÇOKLU YÜKLEME (2026-09-05, Hasan: "ürün görsellerini de tek tek seçiyorum,
   * çoklu kabul etmiyor").
   *
   * - Dosyalar SIRAYLA yüklenir: aynı anda 10 istek atmak sunucudaki görsel işlemeyi
   *   (webp dönüşümü) gereksiz yere sıkıştırır; sıra hem daha öngörülebilir hem de
   *   sonuçtaki DİZİLİM seçim sırasıyla aynı kalır — kapak görseli ilk eleman olduğu
   *   için bu sıra önemli.
   * - `max` sınırı aşılırsa fazlası SESSİZCE atılmaz, kaç tanesinin alındığı söylenir.
   * - Biri düşerse diğerleri devam eder; sonunda kaç başarılı/hatalı olduğu bildirilir.
   * - Yükleme bitince liste TEK SEFERDE güncellenir (her dosyada onChange çağırmak
   *   üst formu her seferinde yeniden çizerdi).
   */
  async function handleFiles(list: FileList | File[] | null | undefined) {
    let dosyalar = Array.from(list ?? []);
    if (dosyalar.length === 0) return;

    const bosYer = max - value.length;
    if (bosYer <= 0) {
      toast.error(`En fazla ${max} görsel ekleyebilirsiniz.`);
      return;
    }
    if (dosyalar.length > bosYer) {
      toast.error(`Sınır ${max} görsel — ilk ${bosYer} tanesi alınıyor.`);
      dosyalar = dosyalar.slice(0, bosYer);
    }

    setBusy(true);
    setSira(dosyalar.length > 1 ? { simdi: 1, toplam: dosyalar.length } : null);
    const yeni: string[] = [];
    const hatalar: string[] = [];
    try {
      for (let i = 0; i < dosyalar.length; i++) {
        setSira(dosyalar.length > 1 ? { simdi: i + 1, toplam: dosyalar.length } : null);
        try {
          yeni.push(await uploadImage(dosyalar[i]!));
        } catch (e) {
          hatalar.push(`"${dosyalar[i]!.name}": ${e instanceof Error ? e.message : "yüklenemedi"}`);
        }
      }
      if (yeni.length) {
        onChange([...value, ...yeni]);
        toast.success(
          dosyalar.length > 1 ? `${yeni.length}/${dosyalar.length} görsel yüklendi.` : "Görsel yüklendi.",
        );
      }
      for (const h of hatalar.slice(0, 3)) toast.error(h);
      if (hatalar.length > 3) toast.error(`ve ${hatalar.length - 3} görsel daha yüklenemedi.`);
    } finally {
      setBusy(false);
      setSira(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="grid grid-cols-3 gap-2">
        {value.map((img, i) => (
          <div
            key={img}
            draggable
            onDragStart={(e) => {
              setDragIndex(i);
              e.dataTransfer.effectAllowed = "move";
              // Firefox sürüklemeyi ancak veri set edilirse başlatır.
              e.dataTransfer.setData("text/plain", String(i));
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (overIndex !== i) setOverIndex(i);
            }}
            onDragLeave={() => setOverIndex((prev) => (prev === i ? null : prev))}
            onDrop={(e) => {
              e.preventDefault();
              const from = dragIndex ?? Number(e.dataTransfer.getData("text/plain"));
              if (Number.isInteger(from)) reorder(from, i);
              dragBitti();
            }}
            onDragEnd={dragBitti}
            className={`relative group cursor-grab active:cursor-grabbing rounded transition-shadow ${
              dragIndex === i ? "opacity-40" : ""
            } ${overIndex === i && dragIndex !== i ? "ring-2 ring-brand-500 ring-offset-1" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveImg(img)}
              alt={`Görsel ${i + 1}`}
              draggable={false}
              className="aspect-square object-cover rounded border border-paper-200 w-full pointer-events-none"
            />
            {i === 0 ? (
              <span className="absolute top-1 left-1 text-[9px] bg-ink-900 text-paper-50 px-1.5 py-0.5 rounded">
                Kapak
              </span>
            ) : (
              <span className="absolute top-1 left-1 text-[9px] bg-ink-900/60 text-paper-50 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {i + 1}
              </span>
            )}

            {/* Sürükleme tutamağı — kutucuğun sürüklenebilir olduğunu görünür kılar. */}
            <DotsSixVertical
              size={14}
              weight="bold"
              className="absolute bottom-1 left-1 text-paper-50 drop-shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            />

            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 p-1 rounded-full bg-ink-900/70 text-paper-50 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Görsel ${i + 1}'i kaldır`}
            >
              <X size={12} weight="bold" />
            </button>

            {/* Dokunmatik + klavye yolu: HTML5 sürükle-bırak telefonda ÇALIŞMAZ, bu yüzden
                ok düğmeleri şart. Odaklanınca da görünür (klavye erişimi). */}
            <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => reorder(i, i - 1)}
                disabled={i === 0}
                className="p-1 rounded bg-ink-900/70 text-paper-50 disabled:opacity-30 hover:bg-ink-900"
                aria-label={`Görsel ${i + 1}'i öne al`}
                title="Öne al"
              >
                <CaretLeft size={10} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => reorder(i, i + 1)}
                disabled={i === value.length - 1}
                className="p-1 rounded bg-ink-900/70 text-paper-50 disabled:opacity-30 hover:bg-ink-900"
                aria-label={`Görsel ${i + 1}'i geri al`}
                title="Geri al"
              >
                <CaretRight size={10} weight="bold" />
              </button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="aspect-square flex flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-paper-200 text-[10px] text-ink-500 hover:border-ink-300 hover:bg-paper-100 disabled:opacity-60"
          >
            {busy ? (
              <>
                <CircleNotch size={18} className="animate-spin" />
                {/* Çoklu yüklemede kaçıncı dosyada olduğumuz görünsün. */}
                {sira && <span className="tabular-nums">{sira.simdi}/{sira.toplam}</span>}
              </>
            ) : (
              <>
                <UploadSimple size={18} /> Ekle
              </>
            )}
          </button>
        )}
      </div>
      <p className="mt-2 text-[10px] text-ink-400">
        Birden fazla görsel seçebilirsiniz · sürükleyerek sıralayın — baştaki görsel kapak
        olur · JPG/PNG/WEBP · max 5MB
      </p>
    </div>
  );
}
