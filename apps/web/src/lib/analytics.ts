/**
 * İnce GA4/gtag sarmalayıcı.
 *
 * gtag yalnızca NEXT_PUBLIC_GA4_ID env'i tanımlıysa yüklenir (bkz. components/analytics.tsx).
 * Bu yüzden `track()` gtag yoksa SESSİZCE yok sayar — GA4 ID girilene kadar
 * kod hata vermeden çalışır, ID girilince event'ler otomatik akmaya başlar.
 *
 * Standart GA4 e-ticaret event adları kullanılır:
 *   add_to_cart, begin_checkout, generate_lead, view_item, contact, newsletter_signup
 */

type GtagParams = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: string, params: GtagParams = {}): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", event, params);
  } else if (process.env.NODE_ENV !== "production") {
    // Dev'de event'lerin tetiklendiğini görmek için (gtag yokken)
    console.debug("[analytics] gtag yok — event yutuldu:", event, params);
  }
}
