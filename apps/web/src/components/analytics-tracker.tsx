"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/visitor-analytics";

/**
 * Birinci-parti sayfa görüntüleme izleme (SPA route değişimi dahil).
 * Her pathname değişiminde trackPageView ateşler. Consent yoksa NO-OP (visitor-analytics içinde).
 * Null-render: root layout'a yerleştirilir.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
