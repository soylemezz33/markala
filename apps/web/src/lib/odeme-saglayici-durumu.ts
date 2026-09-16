"use client";

import { useEffect, useState } from "react";

/**
 * Kart ödeme sağlayıcısı (iyzico) erişim durumu — /odeme ve /odeme/hata için (2026-09-16).
 *
 * 16 Eylül'de iyzico üretim ucu aynı gün iki kez erişilemez oldu; müşteriler kartla ödeyemedi ve
 * neden anlamadan destek yazdı. Hasan: "sorun devam ederse kart ödeme alanında uyarı çıkaralım".
 * API'deki herkese açık /health/odeme özeti (60 sn önbellek) okunur; yalnız "sorunlu" iken uyarı
 * basılır. Ölçüm alınamazsa (API'ye ulaşılamadı vb.) uyarı BASILMAZ — yanlış alarm, sessiz kalmaktan kötü.
 */
export function useOdemeSaglayiciDurumu(): { sorunlu: boolean } {
  const [sorunlu, setSorunlu] = useState(false);
  useEffect(() => {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.markala.com.tr").replace(/\/$/, "");
    let iptal = false;
    const kontrol = async () => {
      try {
        const r = await fetch(`${apiBase}/api/health/odeme`, { cache: "no-store" });
        if (!r.ok) return;
        const d = (await r.json()) as { durum?: string };
        if (!iptal) setSorunlu(d.durum === "sorunlu");
      } catch {
        /* sessiz: uyarı basma */
      }
    };
    void kontrol();
    const t = setInterval(kontrol, 60_000);
    return () => {
      iptal = true;
      clearInterval(t);
    };
  }, []);
  return { sorunlu };
}
