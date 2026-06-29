/**
 * Baskı öncesi otomatik kontrol (preflight) — Fabric.js tasarım JSON'u üzerinden.
 * block → render durur; warn → kullanıcıya gösterilir; info → bilgilendirme.
 *
 * Efektif DPI ~ 25.4 × pxPerMm / scale (görsel natural-px, scale ile kodlanır).
 * pxPerMm web `displayScale` ile AYNI formülden türetilir (mm'den; canvas px saklanmaz).
 */
export interface PreflightItem {
  level: "block" | "warn" | "info";
  code: string;
  message: string;
}

interface FabricObject {
  type?: string;
  scaleX?: number;
  scaleY?: number;
}
interface FabricDocument {
  objects?: FabricObject[];
}

/** web canvas-spec.displayScale ile birebir (560px hedef kutu, 6 px/mm tavan). */
function pxPerMm(widthMm: number, heightMm: number, bleedMm: number): number {
  const w = widthMm + bleedMm * 2;
  const h = heightMm + bleedMm * 2;
  return Math.min(560 / w, 560 / h, 6);
}

export function runPreflight(
  doc: unknown,
  dims: { widthMm: number; heightMm: number; bleedMm: number },
): PreflightItem[] {
  const items: PreflightItem[] = [];
  const d = (doc ?? {}) as FabricDocument;
  const objects = Array.isArray(d.objects) ? d.objects : [];

  if (objects.length === 0) {
    items.push({ level: "block", code: "empty", message: "Tasarım boş — en az bir öğe ekleyin." });
    return items;
  }

  const ppm = pxPerMm(dims.widthMm, dims.heightMm, dims.bleedMm);
  const largeFormat = Math.max(dims.widthMm, dims.heightMm) >= 500;
  const blockTh = largeFormat ? 50 : 72;
  const warnTh = largeFormat ? 100 : 150;

  for (const o of objects) {
    if ((o.type ?? "").toLowerCase().includes("image")) {
      const scale = Math.max(Math.abs(o.scaleX ?? 1), Math.abs(o.scaleY ?? 1), 0.01);
      const dpi = Math.round((25.4 * ppm) / scale);
      if (dpi < blockTh) {
        items.push({
          level: "block",
          code: "low_dpi",
          message: `Görsel çözünürlüğü çok düşük (~${dpi} DPI) — baskı bulanık çıkar, görseli küçültün veya yüksek çözünürlüklü yükleyin.`,
        });
      } else if (dpi < warnTh) {
        items.push({
          level: "warn",
          code: "soft_dpi",
          message: `Görsel çözünürlüğü sınırda (~${dpi} DPI) — baskı yumuşak olabilir.`,
        });
      }
    }
  }

  items.push({
    level: "info",
    code: "cmyk",
    message: "Tasarım baskı için CMYK'ya çevrilir; parlak ekran renkleri baskıda hafif değişebilir.",
  });
  return items;
}

export function hasBlock(items: PreflightItem[]): boolean {
  return items.some((i) => i.level === "block");
}
