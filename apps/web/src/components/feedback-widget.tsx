"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Formbricks site içi anketi — "Aradığınızı bulabildiniz mi?"
 *
 * Teslimat sonrası link anketi (feedback.324ajans.com/s/...) satın ALANI ölçer.
 * Bu widget satın ALMADAN ayrılanı ölçer: ürün listesinde aradığını bulamayan
 * ziyaretçiden eksik ürün/ölçü talebini toplar.
 *
 * Env değişkenleri:
 *   NEXT_PUBLIC_FORMBRICKS_ENV_ID — Formbricks environment id.
 *                                   TANIMSIZSA SDK HİÇ YÜKLENMEZ (varsayılan: kapalı).
 *   NEXT_PUBLIC_FORMBRICKS_URL    — self-host adresi (varsayılan feedback.324ajans.com)
 *
 * ÖNEMLİ — Cloudflare Access: `@formbricks/js` paketi yalnızca ~3 KB'lık bir yükleyicidir;
 * asıl widget kodunu `${appUrl}/js/formbricks.umd.cjs` adresinden çeker. feedback.324ajans.com
 * Cloudflare Access arkasındadır ve `/js` yolu bypass listesinde DEĞİLSE bu istek login
 * sayfasına 302 döner — widget sessizce hiç açılmaz. Env'i tanımlamadan önce
 * `feedback.324ajans.com/js/*` için Access bypass tanımlanmalıdır.
 *
 * KVKK: widget, ziyaretçi başına anonim bir kimliği localStorage'a yazar. Bu nedenle
 * çerez onayının "analytics" kategorisine bağlandı — onay yoksa SDK indirilmez bile.
 */

const ENV_ID = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;
const APP_URL = process.env.NEXT_PUBLIC_FORMBRICKS_URL || "https://feedback.324ajans.com";

/**
 * Formbricks tarafındaki code action'ın ADI. Widget eşleştirmeyi actionClass.name
 * üzerinden yapar (key üzerinden değil) — Formbricks'te ad değişirse tetikleme kırılır.
 */
const TETIKLEYICI = "site_geri_bildirim";

/** Anketin gösterileceği yollar — ürün listesi ve kategori sayfaları. */
function anketYolu(pathname: string): boolean {
  return pathname === "/urunler" || pathname.startsWith("/urunler/");
}

/** Cookie consent'i lib/analytics.ts ile aynı biçimde okur (circular import olmadan). */
function analyticsOnayi(): boolean {
  try {
    const m = document.cookie.match(/(?:^|; )markala_cookie_consent=([^;]+)/);
    const ham = m?.[1];
    if (!ham) return false;
    const v = JSON.parse(decodeURIComponent(ham)) as { analytics?: boolean };
    return v?.analytics === true;
  } catch {
    return false;
  }
}

export function FeedbackWidget() {
  const pathname = usePathname();
  // SDK bir kez kurulur; sonraki yol değişimlerinde yalnızca route change bildirilir.
  const kuruldu = useRef(false);
  // Aynı oturumda aynı yol için tekrar tetikleme yapma (anketin kendi displayOnce
  // kuralına ek olarak gereksiz ağ isteğini de engeller).
  const tetiklenen = useRef<string | null>(null);

  useEffect(() => {
    if (!ENV_ID) return;
    if (!analyticsOnayi()) return;

    let iptal = false;

    void (async () => {
      try {
        const formbricks = (await import("@formbricks/js")).default;

        if (iptal) return;

        if (!kuruldu.current) {
          await formbricks.setup({ environmentId: ENV_ID, appUrl: APP_URL });
          kuruldu.current = true;
        } else {
          await formbricks.registerRouteChange();
        }

        if (anketYolu(pathname) && tetiklenen.current !== pathname) {
          tetiklenen.current = pathname;
          await formbricks.track(TETIKLEYICI, {
            hiddenFields: { sayfa: pathname },
          });
        }
      } catch (e) {
        // Anket aracı sitenin çalışmasını etkilememeli: hata yutulur, yalnızca dev'de loglanır.
        if (process.env.NODE_ENV === "development") {
          console.debug("[feedback] Formbricks yüklenemedi:", e);
        }
      }
    })();

    return () => {
      iptal = true;
    };
  }, [pathname]);

  return null;
}
