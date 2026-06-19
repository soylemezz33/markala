"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/visitor-analytics";
import { fbtrack } from "@/lib/analytics";

/**
 * Birinci-parti sayfa görüntüleme izleme (SPA route değişimi dahil).
 * Her pathname değişiminde trackPageView ateşler. Consent yoksa NO-OP (visitor-analytics içinde).
 * Meta Pixel PageView: fbtrack() consent kontrolü yapar (KVKK/GDPR — analytics.tsx init'ten kaldırıldı).
 * Null-render: root layout'a yerleştirilir.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    trackPageView(pathname);
    fbtrack("PageView");
  }, [pathname]);

  return null;
}
