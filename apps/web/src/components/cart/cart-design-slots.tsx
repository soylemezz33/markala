"use client";

import { useState } from "react";
import { CaretDown, CaretUp, Paperclip } from "@phosphor-icons/react";
import type { CartItem } from "@markala/types";
import { useCartStore } from "@/lib/cart-store";
import { DesignSlots, slotlariNormalize, type TasarimSlotu } from "@/components/product/design-slots";

/**
 * Sepet satırında tasarım dosyaları (2026-09-03, Hasan madde 2).
 *
 * Ürün sayfasında set adedi 1 iken sepette 2'ye çıkarılırsa 2. tasarımın dosyası eksiktir; müşteri
 * ürün sayfasına dönmeden burada tamamlar. Özet satırı "Tasarım 1: 2 dosya · Tasarım 2: eksik"
 * biçiminde; açınca DesignSlots gelir. 2026-09-14: tasarım desteği istenen kalemde de gösterilir
 * (logo/görsel materyali, isteğe bağlı) — eksik uyarısı ve zorunluluk dili yalnız baskı dosyasında.
 */
export function CartDesignSlots({ item, compact = false }: { item: CartItem; compact?: boolean }) {
  const setDesigns = useCartStore((s) => s.setDesigns);
  const [acik, setAcik] = useState(false);
  const cfg = item.configuration as CartItem["configuration"] & { designs?: TasarimSlotu[] };
  const materyal = Boolean(cfg.needsDesign);

  const slots = slotlariNormalize(cfg.designs, item.quantity);
  const eksik = materyal ? 0 : slots.filter((s) => s.files.length === 0).length;
  const toplam = slots.reduce((n, s) => n + s.files.length, 0);
  if (slots.length === 1 && toplam === 0 && !acik) {
    // Tek set, hiç dosya yok: küçük bir "dosya ekle" bağlantısı yeter (eski davranışa yakın).
  }

  return (
    <div className={compact ? "mt-1.5" : "mt-2"}>
      <button
        type="button"
        onClick={() => setAcik((a) => !a)}
        className={`inline-flex items-center gap-1.5 text-xs ${eksik > 0 ? "text-warning font-medium" : "text-success"}`}
        aria-expanded={acik}
      >
        <Paperclip size={13} />
        {toplam === 0
          ? materyal
            ? "Logo / görsel ekleyin (isteğe bağlı)"
            : slots.length > 1 ? `${slots.length} set için tasarım dosyası ekleyin` : "Tasarım dosyası ekleyin"
          : eksik > 0
            ? `${slots.length - eksik}/${slots.length} tasarım yüklendi · ${eksik} eksik`
            : slots.length > 1 ? `${slots.length} tasarım · ${toplam} dosya` : `${toplam} dosya yüklendi`}
        {acik ? <CaretUp size={12} /> : <CaretDown size={12} />}
      </button>
      {acik && (
        <div className="mt-2">
          <DesignSlots
            count={item.quantity}
            designs={slots}
            onChange={(designs) => setDesigns(item.id, designs)}
            compact
            idPrefix={`sepet-${item.id}`}
            etiket={materyal ? "Elinizdeki materyaller (isteğe bağlı)" : undefined}
            ipucu={materyal ? "Logo, görsel, metin · AI, PDF, JPG, PNG, WEBP" : undefined}
          />
        </div>
      )}
    </div>
  );
}
