/**
 * Tasarım aracı — kanonik baskı ölçü tablosu (mm).
 *
 * Ürün gerçek baskı ölçüsü Markala kataloğunda YAPISAL değil (sizeLabel serbest metin,
 * ölçü mockup metninde gömülü). Editör canvas'ı bunu yapısal mm olarak almalı → bu tablo
 * tek-doğru-kaynaktır. Sonraki faz: katalog ürünü (option rules) ↔ bu spec eşlemesi.
 *
 * Sunucu + client ortak (saf veri, "use client" YOK).
 */
export interface CanvasSpec {
  /** editör ürün anahtarı (katalog slug'ından bağımsız olabilir) */
  key: string;
  name: string;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  /** güvenli alan: trim'den içeri pay */
  safeMm: number;
  doubleSided: boolean;
  /** kesim biçimi — yuvarlak kaşe/sticker için kılavuz dairesi */
  shape: "rect" | "round";
}

const SPECS: Record<string, CanvasSpec> = {
  kartvizit: { key: "kartvizit", name: "Kartvizit", widthMm: 85, heightMm: 55, bleedMm: 3, safeMm: 3, doubleSided: true, shape: "rect" },
  "a6-el-ilani": { key: "a6-el-ilani", name: "El İlanı (A6)", widthMm: 105, heightMm: 148, bleedMm: 3, safeMm: 4, doubleSided: false, shape: "rect" },
  "a5-brosur": { key: "a5-brosur", name: "Broşür (A5)", widthMm: 148, heightMm: 210, bleedMm: 3, safeMm: 5, doubleSided: true, shape: "rect" },
  "kare-sticker": { key: "kare-sticker", name: "Kare Sticker", widthMm: 50, heightMm: 50, bleedMm: 2, safeMm: 3, doubleSided: false, shape: "rect" },
  "yuvarlak-sticker": { key: "yuvarlak-sticker", name: "Yuvarlak Sticker", widthMm: 50, heightMm: 50, bleedMm: 2, safeMm: 3, doubleSided: false, shape: "round" },
  "yuvarlak-kase": { key: "yuvarlak-kase", name: "Yuvarlak Kaşe", widthMm: 40, heightMm: 40, bleedMm: 0, safeMm: 2, doubleSided: false, shape: "round" },
  "dikdortgen-kase": { key: "dikdortgen-kase", name: "Dikdörtgen Kaşe", widthMm: 47, heightMm: 18, bleedMm: 0, safeMm: 2, doubleSided: false, shape: "rect" },
  rollup: { key: "rollup", name: "Roll-up Banner", widthMm: 850, heightMm: 2000, bleedMm: 0, safeMm: 50, doubleSided: false, shape: "rect" },
};

export const DEFAULT_SPEC: CanvasSpec = SPECS.kartvizit as CanvasSpec;

export function getCanvasSpec(key?: string | null): CanvasSpec {
  const s = key ? SPECS[key] : undefined;
  return s ?? DEFAULT_SPEC;
}

export const ALL_SPECS: CanvasSpec[] = Object.values(SPECS);

/**
 * Katalog ürününü editör spec anahtarına eşler (slug/kategori/ad anahtar kelimeleriyle).
 * Eşleşme yoksa null → PDP'de "Online Tasarla" CTA gösterilmez (güvenli varsayılan).
 */
export function designSpecKeyForProduct(p: {
  slug?: string;
  name?: string;
  categorySlug?: string;
}): string | null {
  const hay = `${p.slug ?? ""} ${p.name ?? ""} ${p.categorySlug ?? ""}`.toLowerCase();
  if (hay.includes("kartvizit")) return "kartvizit";
  if (hay.includes("yuvarlak") && (hay.includes("sticker") || hay.includes("etiket"))) return "yuvarlak-sticker";
  if (hay.includes("sticker") || hay.includes("etiket")) return "kare-sticker";
  if (hay.includes("kaşe") || hay.includes("kase")) return "dikdortgen-kase";
  if (hay.includes("broşür") || hay.includes("brosur")) return "a5-brosur";
  if (hay.includes("el ilanı") || hay.includes("el-ilani")) return "a6-el-ilani";
  if (hay.includes("roll")) return "rollup";
  return null;
}

/** mm → ekran px ölçeği: artboard hedef kutuya sığsın (büyük format küçülür). */
export function displayScale(spec: CanvasSpec, maxPx = 560): number {
  const wmm = spec.widthMm + spec.bleedMm * 2;
  const hmm = spec.heightMm + spec.bleedMm * 2;
  return Math.min(maxPx / wmm, maxPx / hmm, 6); // 6 px/mm tavanı (küçük ürünler aşırı büyümesin)
}

/** 300 DPI baskı çıktısı için toDataURL/SVG çarpanı (hedef px/mm ÷ ekran px/mm). */
export function exportMultiplier(pxPerMm: number, dpi = 300): number {
  return dpi / 25.4 / pxPerMm;
}
