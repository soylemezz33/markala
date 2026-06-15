"use client";

import { useRef, useState } from "react";
import {
  UploadSimple,
  X,
  CircleNotch,
  ImageSquare,
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

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (value.length >= max) {
      toast.error(`En fazla ${max} görsel ekleyebilirsiniz.`);
      return;
    }
    setBusy(true);
    try {
      const url = await uploadImage(file);
      onChange([...value, url]);
      toast.success("Görsel yüklendi.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Görsel yüklenemedi.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="grid grid-cols-3 gap-2">
        {value.map((img, i) => (
          <div key={`${img}-${i}`} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveImg(img)}
              alt={`Görsel ${i + 1}`}
              className="aspect-square object-cover rounded border border-paper-200 w-full"
            />
            {i === 0 && (
              <span className="absolute top-1 left-1 text-[9px] bg-ink-900 text-paper-50 px-1.5 py-0.5 rounded">
                Kapak
              </span>
            )}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 p-1 rounded-full bg-ink-900/70 text-paper-50 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Görsel ${i + 1}'i kaldır`}
            >
              <X size={12} weight="bold" />
            </button>
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
              <CircleNotch size={18} className="animate-spin" />
            ) : (
              <>
                <UploadSimple size={18} /> Ekle
              </>
            )}
          </button>
        )}
      </div>
      <p className="mt-2 text-[10px] text-ink-400">
        İlk görsel kapak olarak kullanılır · JPG/PNG/WEBP · max 5MB
      </p>
    </div>
  );
}
