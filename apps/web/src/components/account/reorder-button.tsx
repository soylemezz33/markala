"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@markala/ui";
import { ArrowsClockwise } from "@phosphor-icons/react";
import type { Order } from "@markala/types";
import { reorderOrder } from "@/lib/reorder";

/**
 * "Tekrar Sipariş Et" — teslim edilmiş siparişlerde görünür; kalemleri aynı
 * konfigürasyonla (GÜNCEL fiyattan) sepete ekleyip /sepet'e yönlendirir.
 * Hiçbir kalem eklenemezse yönlendirme yapılmaz, buton altında neden gösterilir.
 */
export function ReorderButton({
  order,
  variant = "outline",
  className,
}: {
  order: Pick<Order, "items">;
  variant?: "outline" | "primary";
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReorder() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await reorderOrder(order);
      if (result.added === 0) {
        // Tüm kalemler atlandı (ürünler satıştan kalkmış olabilir) — boş sepete yönlendirme.
        setError("Bu siparişteki ürünler şu an tekrar sipariş edilemiyor — ürünler satıştan kalkmış olabilir.");
        return;
      }
      // Atlanan kalem bildirimi + "fiyatlar güncel" uyarısı /sepet sayfasında gösterilir
      // (reorder.ts tek seferlik not bırakır).
      router.push("/sepet");
    } catch {
      setError("Bir sorun oluştu, lütfen tekrar dene.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <Button variant={variant} onClick={handleReorder} disabled={busy}>
        <ArrowsClockwise size={16} weight="bold" />
        {busy ? "Sepete ekleniyor…" : "Tekrar Sipariş Et"}
      </Button>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}
