"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as fabric from "fabric";
import {
  TextT,
  Square,
  Circle as CircleIcon,
  Image as ImageIcon,
  Trash,
  ArrowUp,
  ArrowDown,
  FloppyDisk,
  DownloadSimple,
  ArrowCounterClockwise,
  SquaresFour,
  type Icon,
} from "@phosphor-icons/react";
import {
  getCanvasSpec,
  displayScale,
  exportMultiplier,
  ALL_SPECS,
} from "@/lib/design/canvas-spec";
import { templatesFor, type DesignTemplate } from "@/lib/design/templates";

/**
 * Markala Online Tasarım Aracı — free-form editör (Fabric.js v7, %100 açık kaynak).
 * Faz 2: ürün ebadından mm canvas (çoklu ürün + dinamik ölçek) + şablon kütüphanesi.
 * Sonraki: backend kaydet/yükle, Ghostscript/Scribus CMYK PDF, DPI/preflight.
 */

const PALETTE = ["#1A1A1A", "#FFFFFF", "#F5B800", "#E11D48", "#2563EB", "#059669", "#7C3AED", "#92400E"];

type SelKind = "none" | "text" | "shape" | "image";

export function DesignEditor({ specKey }: { specKey?: string }) {
  const router = useRouter();
  const spec = useMemo(() => getCanvasSpec(specKey), [specKey]);
  const pxPerMm = useMemo(() => displayScale(spec), [spec]);
  const W = Math.round((spec.widthMm + spec.bleedMm * 2) * pxPerMm);
  const H = Math.round((spec.heightMm + spec.bleedMm * 2) * pxPerMm);
  const EXPORT_MULTIPLIER = exportMultiplier(pxPerMm);
  const insetSafe = Math.round((spec.bleedMm + spec.safeMm) * pxPerMm);
  const insetBleed = Math.round(spec.bleedMm * pxPerMm);

  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fcRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const undoStack = useRef<string[]>([]);

  const [selKind, setSelKind] = useState<SelKind>("none");
  const [fill, setFill] = useState<string>("#1A1A1A");
  const [fontSize, setFontSize] = useState<number>(24);
  const [ready, setReady] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const templates = useMemo(() => templatesFor(spec.key), [spec.key]);

  const snapshot = useCallback(() => {
    const fc = fcRef.current;
    if (!fc) return;
    undoStack.current.push(JSON.stringify(fc.toJSON()));
    if (undoStack.current.length > 40) undoStack.current.shift();
  }, []);

  const syncSelection = useCallback(() => {
    const fc = fcRef.current;
    if (!fc) return;
    const obj = fc.getActiveObject();
    if (!obj) {
      setSelKind("none");
      return;
    }
    if (obj instanceof fabric.Textbox || obj instanceof fabric.IText) {
      setSelKind("text");
      setFontSize(Math.round((obj.fontSize as number) ?? 24));
      setFill((obj.fill as string) ?? "#1A1A1A");
    } else if (obj instanceof fabric.FabricImage) {
      setSelKind("image");
    } else {
      setSelKind("shape");
      setFill((obj.fill as string) ?? "#1A1A1A");
    }
  }, []);

  useEffect(() => {
    if (!canvasElRef.current) return;
    const fc = new fabric.Canvas(canvasElRef.current, {
      width: W,
      height: H,
      backgroundColor: "#FFFFFF",
      preserveObjectStacking: true,
    });
    fcRef.current = fc;
    undoStack.current = [JSON.stringify(fc.toJSON())]; // boş baz (geri-al için)

    const onChange = () => snapshot();
    fc.on("object:added", onChange);
    fc.on("object:modified", onChange);
    fc.on("object:removed", onChange);
    fc.on("selection:created", syncSelection);
    fc.on("selection:updated", syncSelection);
    fc.on("selection:cleared", () => setSelKind("none"));

    setReady(true);
    return () => {
      fc.dispose();
      fcRef.current = null;
    };
  }, [W, H, snapshot, syncSelection]);

  const center = () => ({ left: W / 2, top: H / 2 });

  function addText() {
    const fc = fcRef.current;
    if (!fc) return;
    const t = new fabric.Textbox("Metniniz", {
      ...center(),
      originX: "center",
      originY: "center",
      fontSize: Math.max(14, Math.round(5 * pxPerMm)),
      fill: "#1A1A1A",
      fontFamily: "Inter, sans-serif",
      width: W * 0.5,
      textAlign: "center",
    });
    fc.add(t);
    fc.setActiveObject(t);
    fc.renderAll();
    syncSelection();
  }

  function addRect() {
    const fc = fcRef.current;
    if (!fc) return;
    const r = new fabric.Rect({ ...center(), originX: "center", originY: "center", width: W * 0.4, height: H * 0.25, fill: "#F5B800", rx: 6, ry: 6 });
    fc.add(r);
    fc.setActiveObject(r);
    fc.renderAll();
  }

  function addCircle() {
    const fc = fcRef.current;
    if (!fc) return;
    const c = new fabric.Circle({ ...center(), originX: "center", originY: "center", radius: Math.min(W, H) * 0.2, fill: "#2563EB" });
    fc.add(c);
    fc.setActiveObject(c);
    fc.renderAll();
  }

  async function onImagePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const fc = fcRef.current;
    const file = e.target.files?.[0];
    if (!fc || !file) return;
    const dataUrl = await new Promise<string>((res) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.readAsDataURL(file);
    });
    const img = await fabric.FabricImage.fromURL(dataUrl, { crossOrigin: "anonymous" });
    const maxW = W * 0.5;
    if (img.width && img.width > maxW) img.scaleToWidth(maxW);
    img.set({ ...center(), originX: "center", originY: "center" });
    fc.add(img);
    fc.setActiveObject(img);
    fc.renderAll();
    e.target.value = "";
  }

  function deleteSelected() {
    const fc = fcRef.current;
    if (!fc) return;
    fc.getActiveObjects().forEach((o) => fc.remove(o));
    fc.discardActiveObject();
    fc.renderAll();
    setSelKind("none");
  }

  function bringForward() {
    const fc = fcRef.current;
    const o = fc?.getActiveObject();
    if (fc && o) {
      fc.bringObjectForward(o);
      fc.renderAll();
    }
  }
  function sendBackward() {
    const fc = fcRef.current;
    const o = fc?.getActiveObject();
    if (fc && o) {
      fc.sendObjectBackwards(o);
      fc.renderAll();
    }
  }

  function applyFill(color: string) {
    setFill(color);
    const fc = fcRef.current;
    const o = fc?.getActiveObject();
    if (fc && o && selKind !== "image") {
      o.set("fill", color);
      fc.renderAll();
      snapshot();
    }
  }
  function applyFontSize(size: number) {
    setFontSize(size);
    const fc = fcRef.current;
    const o = fc?.getActiveObject();
    if (fc && o && selKind === "text") {
      o.set("fontSize", size);
      fc.renderAll();
    }
  }

  function undo() {
    const fc = fcRef.current;
    if (!fc || undoStack.current.length < 2) return;
    undoStack.current.pop();
    const prev = undoStack.current[undoStack.current.length - 1];
    if (!prev) return;
    fc.loadFromJSON(prev).then(() => {
      fc.renderAll();
      setSelKind("none");
    });
  }

  function applyTemplate(t: DesignTemplate) {
    const fc = fcRef.current;
    if (!fc) return;
    fc.remove(...fc.getObjects());
    fc.backgroundColor = "#FFFFFF";
    t.build(fc, { spec, pxPerMm, width: W, height: H });
    fc.renderAll();
    snapshot();
    setShowTemplates(false);
  }

  function downloadJSON() {
    const fc = fcRef.current;
    if (!fc) return;
    const blob = new Blob([JSON.stringify(fc.toJSON(), null, 2)], { type: "application/json" });
    triggerDownload(blob, `${spec.key}-tasarim.json`);
  }
  function downloadPNG() {
    const fc = fcRef.current;
    if (!fc) return;
    fc.discardActiveObject();
    fc.renderAll();
    const dataUrl = fc.toDataURL({ format: "png", multiplier: EXPORT_MULTIPLIER });
    fetch(dataUrl).then((r) => r.blob()).then((b) => triggerDownload(b, `${spec.key}-300dpi.png`));
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-paper-100">
      {/* Sol araç çubuğu */}
      <aside className="flex lg:flex-col gap-1 p-2 bg-paper-50 border-b lg:border-b-0 lg:border-r border-paper-200">
        <ToolButton icon={TextT} label="Metin" onClick={addText} />
        <ToolButton icon={Square} label="Dikdörtgen" onClick={addRect} />
        <ToolButton icon={CircleIcon} label="Daire" onClick={addCircle} />
        <ToolButton icon={ImageIcon} label="Görsel" onClick={() => fileInputRef.current?.click()} />
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onImagePicked} />
        <div className="hidden lg:block h-px bg-paper-200 my-1" />
        <ToolButton icon={ArrowUp} label="Öne al" onClick={bringForward} />
        <ToolButton icon={ArrowDown} label="Arkaya al" onClick={sendBackward} />
        <ToolButton icon={ArrowCounterClockwise} label="Geri al" onClick={undo} />
        <ToolButton icon={Trash} label="Sil" onClick={deleteSelected} danger />
      </aside>

      {/* Tuval alanı */}
      <main className="flex-1 grid place-items-center p-6 overflow-auto">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <select
              value={spec.key}
              onChange={(e) => router.push(`/tasarim-araci?urun=${e.target.value}`)}
              className="h-9 rounded-lg border border-paper-200 bg-paper-50 px-2 text-sm font-medium text-ink-900"
            >
              {ALL_SPECS.map((s) => (
                <option key={s.key} value={s.key}>{s.name} ({s.widthMm}×{s.heightMm} mm)</option>
              ))}
            </select>
            {templates.length > 0 && (
              <button
                onClick={() => setShowTemplates((v) => !v)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-paper-200 text-sm font-medium text-ink-900 hover:bg-paper-100"
              >
                <SquaresFour size={16} /> Şablonlar
              </button>
            )}
            <span className="text-xs text-ink-500">
              kırmızı: taşma payı · mavi kesik: {spec.shape === "round" ? "kesim çizgisi" : "güvenli alan"}
            </span>
          </div>

          <div className="relative inline-block shadow-lg" style={{ width: W, height: H }}>
            <canvas ref={canvasElRef} />
            {/* Kılavuzlar — Fabric nesnesi DEĞİL, asla export edilmez */}
            <div aria-hidden className="pointer-events-none absolute border-2 border-error/70" style={{ inset: 0 }} />
            <div
              aria-hidden
              className={`pointer-events-none absolute border border-blue-500/70 border-dashed ${spec.shape === "round" ? "rounded-full" : ""}`}
              style={{ inset: spec.shape === "round" ? insetBleed : insetSafe }}
            />
            {!ready && (
              <div className="absolute inset-0 grid place-items-center bg-paper-50 text-ink-500 text-sm">Tuval hazırlanıyor…</div>
            )}

            {/* Şablon paneli */}
            {showTemplates && (
              <div className="absolute left-0 top-0 z-10 w-full h-full bg-ink-900/40 grid place-items-center" onClick={() => setShowTemplates(false)}>
                <div className="bg-paper-50 rounded-xl p-4 shadow-xl max-w-[90%]" onClick={(e) => e.stopPropagation()}>
                  <div className="text-sm font-semibold text-ink-900 mb-3">Şablon seç</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => applyTemplate(t)}
                        className="px-3 py-4 rounded-lg border border-paper-200 text-sm font-medium text-ink-900 hover:border-brand-500 hover:bg-brand-100"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowTemplates(false)} className="mt-3 text-xs text-ink-500 hover:text-ink-900">Boş tuvalle devam et</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sağ özellik paneli */}
      <aside className="w-full lg:w-64 p-4 bg-paper-50 border-t lg:border-t-0 lg:border-l border-paper-200 space-y-5">
        <div className="flex items-center gap-2">
          <button onClick={downloadJSON} className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-lg border border-paper-200 text-sm font-medium text-ink-900 hover:bg-paper-100">
            <FloppyDisk size={16} /> JSON
          </button>
          <button onClick={downloadPNG} className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-lg bg-brand-500 text-sm font-semibold text-ink-900 hover:bg-brand-600">
            <DownloadSimple size={16} /> PNG
          </button>
        </div>

        {selKind === "none" ? (
          <p className="text-sm text-ink-500 leading-relaxed">
            {templates.length > 0 ? "Şablonlardan başla ya da soldan öğe ekle. " : "Soldan bir öğe ekle. "}
            Eklediğin öğeyi seçince rengi/boyutu burada düzenlersin.
          </p>
        ) : (
          <div className="space-y-5">
            {selKind !== "image" && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Renk</div>
                <div className="flex flex-wrap gap-1.5">
                  {PALETTE.map((c) => (
                    <button key={c} onClick={() => applyFill(c)} className={`w-7 h-7 rounded-md border ${fill === c ? "ring-2 ring-ink-900 ring-offset-1" : "border-paper-200"}`} style={{ backgroundColor: c }} aria-label={c} />
                  ))}
                  <input type="color" value={fill} onChange={(e) => applyFill(e.target.value)} className="w-7 h-7 rounded-md border border-paper-200 cursor-pointer" aria-label="Özel renk" />
                </div>
              </div>
            )}
            {selKind === "text" && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Yazı boyutu · {fontSize}</div>
                <input type="range" min={8} max={Math.round(20 * pxPerMm)} value={fontSize} onChange={(e) => applyFontSize(Number(e.target.value))} className="w-full accent-brand-500" />
              </div>
            )}
            <button onClick={deleteSelected} className="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-lg border border-error/40 text-sm font-medium text-error hover:bg-error/5">
              <Trash size={16} /> Seçili öğeyi sil
            </button>
          </div>
        )}

        <p className="text-[11px] text-ink-400 leading-relaxed border-t border-paper-200 pt-3">
          {spec.name} · {spec.widthMm}×{spec.heightMm} mm · taşma {spec.bleedMm}mm.
          Baskıya-hazır CMYK PDF + kaydetme sonraki fazda.
        </p>
      </aside>
    </div>
  );
}

function ToolButton({ icon: IconCmp, label, onClick, danger }: { icon: Icon; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} title={label} className={`group flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-lg text-[10px] font-medium transition-colors ${danger ? "text-error hover:bg-error/10" : "text-ink-700 hover:bg-paper-100 hover:text-ink-900"}`}>
      <IconCmp size={20} />
      {label}
    </button>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
