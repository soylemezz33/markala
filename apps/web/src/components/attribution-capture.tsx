"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureFromUrl } from "@/lib/attribution";

/**
 * URL'deki reklam/kampanya parametrelerini (gclid, gbraid, wbraid, utm_*) iniş anında yakalar.
 *
 * ÖNEMLİ: Bilerek ÇEREZ ONAYINDAN GEÇMEZ. Amacı reklam takibi değil, kendi siparişimizin
 * hangi bağlantıdan geldiğini bilmek (birinci taraf, kendi alan adımızda kalır, üçüncü
 * taraflara gönderilmez). Onaya bağlanan `_gcl_aw` çerezi reddedildiğinde de çalışır —
 * zaten bu modülün var oluş sebebi o boşluk (bkz. lib/attribution.ts başlığı).
 *
 * Route değişiminde de çalışır: reklam bağlantısı bir alt sayfaya inebilir ve Next.js
 * client-side navigasyonda tam sayfa yükleme olmaz. Parametre yoksa captureFromUrl()
 * mevcut kaydı korur, yani site içi gezinme atfı silmez.
 *
 * Null-render; root layout'a yerleştirilir. useSearchParams Suspense sınırı ister —
 * layout'ta <Suspense> ile sarılır.
 */
export function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureFromUrl();
  }, [pathname, searchParams]);

  return null;
}
