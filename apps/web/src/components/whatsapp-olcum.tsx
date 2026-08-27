"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * WhatsApp tıklama ölçümü — SİTE GENELİ, tek merkezden (UX-DENETIM İş 4).
 *
 * Neden delegasyon: wa.me linki 10+ ayrı dosyada; her birine onClick eklemek yerine
 * document seviyesinde tek capture-dinleyici TÜM mevcut ve GELECEKTEKİ WhatsApp
 * linklerini otomatik yakalar. Görsel/etkileşim etkisi sıfır — yalnız ölçüm.
 *
 * kaynak parametresi: linkte data-wa-kaynak varsa o (örn. yüzen balon "balon");
 * yoksa sayfanın yolundan türetilir. GA4 olayı: whatsapp_tikla { kaynak, sayfa }.
 * Sonrası (markala-google tarafı): anahtar etkinlik + Ads ikincil dönüşüm bağlanır.
 */

function kaynakTuret(pathname: string): string {
  if (pathname.startsWith("/urun/")) return "urun";
  if (pathname.startsWith("/kategori/")) return "kategori";
  if (pathname.startsWith("/matbaa/")) return "sehir";
  if (pathname.startsWith("/odeme/hata")) return "odeme_hata";
  if (pathname.startsWith("/odeme")) return "odeme";
  if (pathname.startsWith("/iletisim")) return "iletisim";
  if (pathname.startsWith("/hesabim")) return "hesabim";
  if (pathname.startsWith("/fiyat-listesi")) return "fiyat_listesi";
  if (pathname === "/") return "anasayfa";
  return "sayfa";
}

export function WhatsAppOlcum() {
  useEffect(() => {
    const dinle = (e: MouseEvent) => {
      const hedef = e.target as Element | null;
      const link = hedef?.closest?.(
        'a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href*="whatsapp://"]',
      ) as HTMLAnchorElement | null;
      if (!link) return;
      track("whatsapp_tikla", {
        kaynak: link.dataset.waKaynak || kaynakTuret(window.location.pathname),
        sayfa: window.location.pathname,
        // Navigasyon olayı yutmasın (aynı sekmede açılan linkler için)
        transport_type: "beacon",
      });
    };
    // capture: link kendi navigasyonunu başlatmadan ÖNCE yakala
    document.addEventListener("click", dinle, true);
    return () => document.removeEventListener("click", dinle, true);
  }, []);
  return null;
}
