import * as fabric from "fabric";
import type { CanvasSpec } from "./canvas-spec";

/**
 * Başlangıç şablonları — Fabric nesnelerini canvas'a ekleyen builder fonksiyonları.
 * (Sonraki faz: DesignTemplate DB modeli + admin yönetimi; şimdilik kodda statik.)
 * Metinler placeholder — kullanıcı çift tıklayıp düzenler.
 */
export interface TemplateCtx {
  spec: CanvasSpec;
  pxPerMm: number;
  width: number; // canvas px (bleed dahil)
  height: number;
}
export interface DesignTemplate {
  id: string;
  name: string;
  productKey: string;
  build: (canvas: fabric.Canvas, ctx: TemplateCtx) => void;
}

const BRAND = "#F5B800";
const INK = "#1A1A1A";

function txt(text: string, o: Partial<fabric.Textbox> & { left: number; top: number; width: number }) {
  return new fabric.Textbox(text, {
    fontFamily: "Inter, sans-serif",
    fill: INK,
    fontSize: 18,
    ...o,
  });
}

const kartvizitKlasik: DesignTemplate = {
  id: "kartvizit-klasik",
  name: "Klasik",
  productKey: "kartvizit",
  build: (canvas, { spec, pxPerMm, width, height }) => {
    const m = (v: number) => v * pxPerMm;
    const inner = (spec.bleedMm + spec.safeMm) * pxPerMm;
    // Sol marka şeridi (tam bleed yüksekliği)
    canvas.add(
      new fabric.Rect({ left: 0, top: 0, width: m(spec.bleedMm + 8), height, fill: BRAND }),
    );
    const x = inner + m(8);
    canvas.add(txt("Ad Soyad", { left: x, top: m(spec.bleedMm + 12), width: width - x - inner, fontSize: m(6), fontWeight: "700" }));
    canvas.add(txt("Ünvan / Pozisyon", { left: x, top: m(spec.bleedMm + 22), width: width - x - inner, fontSize: m(3.5), fill: "#6B6B6B" }));
    canvas.add(new fabric.Line([x, m(spec.bleedMm + 30), width - inner, m(spec.bleedMm + 30)], { stroke: BRAND, strokeWidth: Math.max(1, m(0.6)) }));
    canvas.add(txt("0500 000 00 00", { left: x, top: m(spec.bleedMm + 33), width: width - x - inner, fontSize: m(3.2) }));
    canvas.add(txt("ad@firma.com", { left: x, top: m(spec.bleedMm + 39), width: width - x - inner, fontSize: m(3.2) }));
    canvas.add(txt("Firma Adı · Şehir", { left: x, top: m(spec.bleedMm + 45), width: width - x - inner, fontSize: m(3.2), fill: "#6B6B6B" }));
  },
};

const kartvizitModern: DesignTemplate = {
  id: "kartvizit-modern",
  name: "Modern (Koyu)",
  productKey: "kartvizit",
  build: (canvas, { spec, pxPerMm, width, height }) => {
    const m = (v: number) => v * pxPerMm;
    const inner = (spec.bleedMm + spec.safeMm) * pxPerMm;
    canvas.backgroundColor = INK;
    canvas.add(new fabric.Rect({ left: 0, top: height - m(spec.bleedMm + 10), width, height: m(spec.bleedMm + 10), fill: BRAND }));
    canvas.add(txt("Ad Soyad", { left: inner, top: m(spec.bleedMm + 14), width: width - inner * 2, fontSize: m(7), fontWeight: "700", fill: "#FFFFFF" }));
    canvas.add(txt("Ünvan", { left: inner, top: m(spec.bleedMm + 25), width: width - inner * 2, fontSize: m(3.8), fill: BRAND }));
    canvas.add(txt("0500 000 00 00  ·  ad@firma.com", { left: inner, top: height - m(spec.bleedMm + 7.5), width: width - inner * 2, fontSize: m(3), fill: INK }));
  },
};

const kartvizitMinimal: DesignTemplate = {
  id: "kartvizit-minimal",
  name: "Minimal",
  productKey: "kartvizit",
  build: (canvas, { spec, pxPerMm, width, height }) => {
    const m = (v: number) => v * pxPerMm;
    const inner = (spec.bleedMm + spec.safeMm) * pxPerMm;
    canvas.add(txt("AD SOYAD", { left: inner, top: height / 2 - m(8), width: width - inner * 2, fontSize: m(6), fontWeight: "700", textAlign: "center", charSpacing: 120 }));
    canvas.add(new fabric.Line([width / 2 - m(12), height / 2, width / 2 + m(12), height / 2], { stroke: BRAND, strokeWidth: Math.max(1, m(0.8)) }));
    canvas.add(txt("Ünvan · 0500 000 00 00", { left: inner, top: height / 2 + m(3), width: width - inner * 2, fontSize: m(3.2), textAlign: "center", fill: "#6B6B6B" }));
  },
};

const stickerEtiket: DesignTemplate = {
  id: "sticker-etiket",
  name: "Logo + Yazı",
  productKey: "kare-sticker",
  build: (canvas, { spec, pxPerMm, width, height }) => {
    const m = (v: number) => v * pxPerMm;
    canvas.add(new fabric.Circle({ left: width / 2, top: height * 0.38, originX: "center", originY: "center", radius: m(8), fill: BRAND }));
    canvas.add(txt("MARKA", { left: 0, top: height * 0.62, width, fontSize: m(7), fontWeight: "700", textAlign: "center" }));
  },
};

const ALL: DesignTemplate[] = [kartvizitKlasik, kartvizitModern, kartvizitMinimal, stickerEtiket];

/** Ürüne uygun şablonlar (yoksa boş dizi → editör yalnız "boş başla" gösterir). */
export function templatesFor(productKey: string): DesignTemplate[] {
  return ALL.filter((t) => t.productKey === productKey);
}
