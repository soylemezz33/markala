"use client";

import { useRef, useState } from "react";
import { UploadSimple, CircleNotch, Image as ImageIcon, FileText, FilePdf } from "@phosphor-icons/react";
import { toast } from "./toast";

/**
 * Sipariş SATIRINA tasarımcı dosyası yükleme (2026-09-02, üretim ARGE Faz 2; 2026-09-03: 1 GB).
 *
 * Neden var: tasarımı Markala'nın yaptığı siparişlerde bitmiş dosya sisteme hiç girmiyordu;
 * üretimde "hangi bayrak kimin" karışıklığının kök nedeni buydu. Tasarımcı Drive'a elle
 * girmek yerine buradan yükler — tek yer, sipariş numarasıyla otomatik eşleşir.
 *
 * Üç tür (API ile aynı liste, orders.dto.ts DESIGN_KINDS):
 *   onizleme — küçük RGB JPG/PNG (≤ 2 MB). Sunucuya gider; panelde her kartta gösterilir.
 *   calisma  — AI/PSD/CDR/EPS/TIF/ZIP/RAR çalışma dosyası (≤ 1000 MB) → DOĞRUDAN Drive
 *   baski    — baskıya hazır PDF (≤ 1000 MB) → DOĞRUDAN Drive
 *
 * 1000 MB NEDEN DOĞRUDAN DRIVE: Cloudflare ücretsiz plan tek istekte 100 MB geçirir, sunucu
 * belleği de 1 GB'ı taşımaz. Akış: (1) API'den Drive resumable oturumu al (BFF drive-oturum),
 * (2) dosyayı 8 MiB parçalarla Drive'a PUT et (Content-Range; 308 = devam), (3) API'ye
 * "tamamlandı" de (BFF drive-tamamla) → kayıt + Drive'da doğrulama. Drive kapalıysa (env
 * yok) API 409 döner → ≤ 50 MB için eski sunucu yolu (multipart) yedek olarak kullanılır.
 */

export type DesignKind = "onizleme" | "calisma" | "baski";

const MB = 1024 * 1024;
const DRIVE_MAX = 1000 * MB;
const SUNUCU_MAX = 50 * MB;
/** Google 256 KiB katı ister; 8 MiB parça = 1 GB için ~125 istek, kesintide en çok 8 MiB kaybı. */
const PARCA = 8 * MB;

const KINDS: Array<{ id: DesignKind; label: string; hint: string; accept: string; max: number; Icon: typeof ImageIcon }> = [
  { id: "onizleme", label: "Önizleme", hint: "JPG/PNG · RGB · ≤ 2 MB", accept: ".jpg,.jpeg,.png", max: 2 * MB, Icon: ImageIcon },
    // ZIP/RAR/7Z (2026-09-05, Hasan: "grafikerler zip ve rar da yüklemek istedi"):
  // çalışma dosyası çoğu zaman arşivli geliyor — bağlı fontlar, linkli görseller,
  // katman klasörleri. Yalnız BU türde; baskıya hazır dosya PDF olmak zorunda.
  { id: "calisma", label: "Çalışma dosyası", hint: "AI · PSD · CDR · EPS · TIF · ZIP · RAR · ≤ 1000 MB", accept: ".ai,.psd,.cdr,.eps,.tif,.tiff,.pdf,.jpg,.jpeg,.png,.zip,.rar,.7z", max: DRIVE_MAX, Icon: FileText },
    // Arşiv (2026-09-05, Hasan iletti): bir işte onlarca baskı dosyası olduğunda tek tek
  // yüklemek yerine zip'lensin. Yükleyici tek seferde TEK dosya alıyor, o yüzden gerçek
  // bir ihtiyaç. Etiket "PDF" değil "dosya": slotta artık arşiv de olabilir.
  { id: "baski", label: "Baskıya hazır dosya", hint: "PDF (CMYK, taşma paylı) · çok dosyalıysa ZIP/RAR · ≤ 1000 MB", accept: ".pdf,.zip,.rar,.7z", max: DRIVE_MAX, Icon: FilePdf },
];

/** Drive resumable oturumuna parça parça PUT; dosya kimliğini döner. */
async function driveParcaYukle(uploadUrl: string, file: File, onProgress: (oran: number) => void): Promise<{ id: string }> {
  let start = 0;
  let sonYanit: { id?: string } | null = null;
  while (start < file.size) {
    const end = Math.min(start + PARCA, file.size);
    const parca = file.slice(start, end);
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Range": `bytes ${start}-${end - 1}/${file.size}` },
      body: parca,
    });
    if (res.status === 308) {
      // Google kaç byte aldıysa oradan devam (ağ kesintisinde parçanın bir kısmı gitmiş olabilir).
      const range = res.headers.get("range"); // "bytes=0-8388607"
      const alinan = range ? Number(range.split("-")[1]) + 1 : end;
      start = Number.isFinite(alinan) && alinan > start ? alinan : end;
    } else if (res.ok) {
      sonYanit = (await res.json().catch(() => null)) as { id?: string } | null;
      start = file.size;
    } else {
      throw new Error(`Drive yükleme hatası (${res.status}). Tekrar deneyin.`);
    }
    onProgress(Math.min(1, start / file.size));
  }
  if (!sonYanit?.id) throw new Error("Drive dosya kimliği alınamadı.");
  return { id: sonYanit.id };
}

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
  const [oran, setOran] = useState<number | null>(null);
  /** Çoklu yüklemede "3/12" göstergesi; tek dosyada null. */
  const [sira, setSira] = useState<{ simdi: number; toplam: number } | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const secili = KINDS.find((k) => k.id === kind)!;

  async function sunucuyaYukle(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    const res = await fetch(`/api/siparis-tasarim/${orderId}/${itemId}`, { method: "POST", body: fd });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) throw new Error(data.message ?? "Dosya yüklenemedi.");
  }

  async function driveaYukle(file: File): Promise<"ok" | "drive-kapali"> {
    const oturum = await fetch(`/api/siparis-tasarim/${orderId}/${itemId}/drive-oturum`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, fileName: file.name, mimeType: file.type || "application/octet-stream", size: file.size }),
    });
    if (oturum.status === 409) return "drive-kapali";
    const oj = (await oturum.json().catch(() => ({}))) as { uploadUrl?: string; message?: string };
    if (!oturum.ok || !oj.uploadUrl) throw new Error(oj.message ?? "Drive oturumu açılamadı.");
    setOran(0);
    const { id } = await driveParcaYukle(oj.uploadUrl, file, setOran);
    const tamam = await fetch(`/api/siparis-tasarim/${orderId}/${itemId}/drive-tamamla`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, driveFileId: id, fileName: file.name, mimeType: file.type || "application/octet-stream", size: file.size }),
    });
    const tj = (await tamam.json().catch(() => ({}))) as { message?: string };
    if (!tamam.ok) throw new Error(tj.message ?? "Kayıt tamamlanamadı.");
    return "ok";
  }

  /** TEK dosyayı yükler; hata fırlatır (çağıran toplu sonucu raporlar). */
  async function tekDosyaYukle(file: File) {
    if (file.size > secili.max) {
      throw new Error(`"${file.name}" ${Math.round(secili.max / MB)} MB sınırını aşıyor.`);
    }
    if (kind === "onizleme") {
      await sunucuyaYukle(file);
      return;
    }
    const sonuc = await driveaYukle(file);
    if (sonuc === "drive-kapali") {
      if (file.size > SUNUCU_MAX) {
        throw new Error(`"${file.name}": Drive kapalı, sunucu yolu en fazla 50 MB.`);
      }
      await sunucuyaYukle(file);
    }
  }

  /**
   * ÇOKLU YÜKLEME (2026-09-05, Hasan: "tek tek seçiyorum, çoklu kabul etmiyor").
   *
   * Dosyalar SIRAYLA yüklenir, paralel değil: Drive'a doğrudan yüklemede her dosya
   * kendi resumable oturumunu açıyor ve büyük dosyalarda (1000 MB'a kadar) paralel
   * akış hem tarayıcıyı hem bağlantıyı boğar; ayrıca ilerleme yüzdesi tek akışta
   * anlamlı kalır.
   *
   * Biri düşerse DİĞERLERİ DEVAM EDER — 30 dosyalık bir işte 12.'de kopup geri
   * kalanı iptal etmek en kötü davranış olurdu. Sonuçta kaç başarılı / kaç hatalı
   * olduğu tek bildirimde söylenir, hatalıların adı yazılır.
   */
  async function handleFiles(list: FileList | File[] | null | undefined) {
    const dosyalar = Array.from(list ?? []);
    if (dosyalar.length === 0) return;
    setBusy(true);
    setOran(null);
    setSira(dosyalar.length > 1 ? { simdi: 1, toplam: dosyalar.length } : null);
    const hatalar: string[] = [];
    let basarili = 0;
    try {
      for (let i = 0; i < dosyalar.length; i++) {
        setSira(dosyalar.length > 1 ? { simdi: i + 1, toplam: dosyalar.length } : null);
        setOran(null);
        try {
          await tekDosyaYukle(dosyalar[i]!);
          basarili++;
        } catch (e) {
          hatalar.push(e instanceof Error ? e.message : `"${dosyalar[i]!.name}" yüklenemedi.`);
        }
      }
      if (basarili > 0) {
        toast.success(
          dosyalar.length > 1
            ? `${basarili}/${dosyalar.length} dosya eklendi.`
            : `${secili.label} eklendi.`,
        );
        onDone();
      }
      // Hata metinleri tek tek gösterilir ki hangi dosyanın neden düştüğü belli olsun.
      for (const h of hatalar.slice(0, 4)) toast.error(h);
      if (hatalar.length > 4) toast.error(`ve ${hatalar.length - 4} dosya daha yüklenemedi.`);
    } finally {
      setBusy(false);
      setOran(null);
      setSira(null);
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
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
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
          handleFiles(e.dataTransfer.files);
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
            <CircleNotch size={16} className="animate-spin" />
            {/* Çoklu yüklemede hangi dosyada olduğumuz da yazılır: "3/12 · %48" */}
            {sira ? `${sira.simdi}/${sira.toplam} · ` : ""}
            {oran === null ? "Yükleniyor…" : `%${Math.round(oran * 100)}`}
          </>
        ) : (
          <>
            <UploadSimple size={16} />
            <span>
              <strong className="font-semibold text-ink-700">{secili.label}</strong> seç veya sürükle-bırak
              <span className="ml-1 text-[10px] text-ink-400">(birden fazla seçebilirsin)</span>
              <span className="ml-1.5 text-[10px] text-ink-400">{secili.hint}</span>
            </span>
          </>
        )}
      </button>
      {busy && oran !== null && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-paper-200" aria-hidden>
          <div className="h-full bg-brand-500 transition-[width]" style={{ width: `${Math.round(oran * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
