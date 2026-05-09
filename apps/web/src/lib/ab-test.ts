/**
 * Basit A/B test framework — cookie tabanlı, sticky atama.
 *
 * Kullanım:
 *   import { useVariant } from "@/lib/ab-test";
 *   const variant = useVariant("hero-cta-2026");
 *   if (variant === "B") return <CtaB />;
 *
 * Variant atama formülü deterministik (FNV-1a hash) — aynı user her zaman aynı variant'ı görür.
 */

"use client";

import { useEffect, useState } from "react";

const COOKIE = "markala_ab_uid";
const ONE_YEAR = 60 * 60 * 24 * 365;

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

function getOrCreateUid(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`));
  if (m && m[1]) return decodeURIComponent(m[1]);
  const uid =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  document.cookie = `${COOKIE}=${encodeURIComponent(uid)}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  return uid;
}

/**
 * Verilen test ID için variant döndürür ("A" veya "B").
 * SSR sırasında "A" döner, hydrate sonrası gerçek variant'a atlar.
 *
 * GA4'e otomatik olay gönderir: ab_exposure
 */
export function useVariant(testId: string, variants: readonly string[] = ["A", "B"]): string {
  const [variant, setVariant] = useState<string>(variants[0] ?? "A");

  useEffect(() => {
    const uid = getOrCreateUid();
    if (!uid) return;
    const hash = fnv1a(`${uid}:${testId}`);
    const idx = hash % variants.length;
    const v = variants[idx] ?? variants[0]!;
    setVariant(v);

    // GA4 event — varsa
    if (typeof window !== "undefined" && (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag) {
      (window as unknown as { gtag: (...a: unknown[]) => void }).gtag(
        "event",
        "ab_exposure",
        { test_id: testId, variant: v },
      );
    }
  }, [testId, variants]);

  return variant;
}

/**
 * Conversion event tetikle — A/B test sonucu ölçmek için.
 *   trackConversion("hero-cta-2026", "click");
 */
export function trackConversion(testId: string, event: string): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  if (w.gtag) {
    w.gtag("event", "ab_conversion", { test_id: testId, conversion: event });
  }
}
