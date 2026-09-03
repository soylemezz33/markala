"use client";

import { cn } from "@markala/ui";
import { WarningCircle, PencilSimple } from "@phosphor-icons/react";
import { useConfigurator } from "./context";
import { DesignSlots, slotlariNormalize } from "@/components/product/design-slots";

/**
 * Tasarım desteği anahtarı + tasarım alanları (2026-09-03 yeniden yazıldı).
 *
 * `slotCount` = sepet set adedi: m² ürünlerde girilen adet (2 bayrak → 2 alan), matris ürünlerde
 * (kartvizit) ürün sayfasında 1 (set adedi sepette artırılırsa eksik alanlar sepet satırında
 * tamamlanır — CartDesignSlots). Dosya ve hata mantığı DesignSlots'ta; bu bileşen yalnız
 * konfigüratör state'ine bağlar ve kalite uyarılarını ALTA koyar (madde 3: hata artık üstte,
 * alanın içinde).
 */
export function DesignUpload({ slotCount = 1 }: { slotCount?: number }) {
  const { state, dispatch } = useConfigurator();
  const { needsDesign } = state;

  return (
    <div className="border-t border-paper-200 pt-6">
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-sm font-medium text-ink-900">
          Tasarım desteği istiyorum
          <span className="block text-xs text-ink-500 font-normal mt-0.5">
            Profesyonel grafik ekibimiz sizin için hazırlasın, ücretsiz.
          </span>
        </span>
        <button
          type="button"
          onClick={() => dispatch({ type: "TOGGLE_DESIGN_HELP" })}
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors flex-none",
            needsDesign ? "bg-brand-500" : "bg-paper-200",
          )}
          role="switch"
          aria-checked={needsDesign}
          aria-label="Tasarım desteği istiyorum"
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-paper-50 shadow transition-transform",
              needsDesign && "translate-x-5",
            )}
          />
        </button>
      </label>

      {!needsDesign && (
        <div className="mt-4">
          <DesignSlots
            count={slotCount}
            designs={slotlariNormalize(state.designs, slotCount)}
            onChange={(designs) => dispatch({ type: "SET_DESIGNS", designs })}
            onUploadingChange={(n) => dispatch({ type: "SET_UPLOADING", value: n })}
            idPrefix="urun"
          />
        </div>
      )}

      {/* Dosya kalitesi bilgilendirmesi (Hasan talebi 2026-08-23): müşteriler yapay zekâ
          çıktısı / düşük çözünürlüklü dosya gönderiyor, baskıda bulanıklık çıkınca itiraz
          oluyor. Uyarı SİPARİŞ ÖNCESİ burada; sözleşme maddesi (7.C), sipariş başarı sayfası
          ve onay e-postasında da tekrarlanır. Uyarının yanında ücretsiz vektörel çizim
          teklifi verilir — kuru "sorumlu değiliz" yerine hizmete çevrilir. */}
      {!needsDesign && (
        <div className="mt-3 space-y-2">
          <p className="flex items-start gap-2 text-xs text-ink-700 bg-warning/10 border border-warning/25 rounded-md px-3 py-2 leading-relaxed">
            <WarningCircle size={14} className="flex-none mt-0.5 text-warning" weight="fill" />
            <span>
              <strong className="text-ink-900">Dosya kalitesi hakkında:</strong> Yapay zekâ ile
              üretilmiş, düşük çözünürlüklü veya vektörel olmayan dosyalarda baskıda bulanıklık
              ve metin bozulmaları oluşabilir; bu tür dosyalardan kaynaklanan kalite
              sorunlarından markala.com.tr sorumlu değildir. Baskıya en uygun format: vektörel
              PDF/AI (yazılar convert edilmiş) veya 300 DPI CMYK.
            </span>
          </p>
          <p className="flex items-start gap-2 text-xs text-ink-700 bg-brand-100 border border-brand-300 rounded-md px-3 py-2 leading-relaxed">
            <PencilSimple size={14} className="flex-none mt-0.5 text-brand-700" weight="fill" />
            <span>
              Dosyanız bu niteliklere uygun değilse endişelenmeyin: görselinizi yine de
              yükleyin, grafik ekibimiz görselinize istinaden{" "}
              <strong className="text-ink-900">vektörel çizimi ücretsiz hazırlar</strong> ve
              baskı öncesi onayınıza sunar. Üretim, tasarım onayınızdan sonra başlar.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
