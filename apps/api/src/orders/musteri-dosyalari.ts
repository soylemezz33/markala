/**
 * Müşteri tasarım dosyaları — sipariş oluşturulurken DesignUpload satırlarına dönüşüm (2026-09-03).
 *
 * Hasan (madde 2): sepetteki her SET için ayrı tasarım; tasarım başına birden çok dosya; dosya
 * başına 50 MB. Storefront `designs: [{ files: [{fileName, fileUrl, fileSize, mimeType}] }]`
 * gönderir; burada budanır, temizlenir ve DesignUpload (kind="musteri") satırlarına çevrilir.
 *
 * SAF fonksiyon: DB/servis yok, doğrudan test edilir. Sınırlar DoS savunması + mantık:
 * en çok 20 tasarım, tasarım başına 10 dosya, ad 200 karakter. Yalnız bizim API'nin
 * /uploads/design/<uuid.ext> URL'leri kabul edilir (storageKey oradan türetilir; yabancı
 * host'tan gelen URL sessizce atılır — eski siparis-kaydet safeUploadUrl kuralıyla aynı ruh).
 */

export const MAX_TASARIM = 20;
export const MAX_DOSYA_PER_TASARIM = 10;
const KEY_RE = /\/uploads\/design\/([0-9a-f-]{36}\.[a-z0-9]{1,5})(?:\?.*)?$/i;

export interface GelenTasarim {
  files?: Array<{ fileName?: unknown; fileUrl?: unknown; fileSize?: unknown; mimeType?: unknown }>;
}

export interface MusteriDosyaSatiri {
  kind: "musteri";
  designIndex: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
}

function temizAd(v: unknown, yedek: string): string {
  const s = String(v ?? "").trim().replace(/[\r\n\t]/g, " ").slice(0, 200);
  return s || yedek;
}

export function musteriDosyaSatirlari(designs: unknown): MusteriDosyaSatiri[] {
  if (!Array.isArray(designs)) return [];
  const out: MusteriDosyaSatiri[] = [];
  designs.slice(0, MAX_TASARIM).forEach((d, designIndex) => {
    const files = Array.isArray((d as GelenTasarim)?.files) ? (d as GelenTasarim).files!.slice(0, MAX_DOSYA_PER_TASARIM) : [];
    for (const f of files) {
      const url = typeof f?.fileUrl === "string" ? f.fileUrl : "";
      const m = url.match(KEY_RE);
      if (!m) continue;
      const size = Number(f?.fileSize);
      out.push({
        kind: "musteri",
        designIndex,
        fileName: temizAd(f?.fileName, m[1]),
        fileUrl: url.split("?")[0],
        fileSize: Number.isFinite(size) && size > 0 ? Math.floor(size) : 0,
        mimeType: typeof f?.mimeType === "string" && f.mimeType ? f.mimeType.slice(0, 120) : "application/octet-stream",
        storageKey: m[1],
      });
    }
  });
  return out;
}

/** Geriye dönük alanlar: ilk tasarımın ilk dosyası (eski panel/e-posta kodu bunları okur). */
export function ilkDosya(rows: MusteriDosyaSatiri[]): { uploadedFileName: string; uploadedFileUrl: string } | null {
  const r = rows[0];
  return r ? { uploadedFileName: r.fileName, uploadedFileUrl: r.fileUrl } : null;
}
