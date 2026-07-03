"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          action?: string;
          theme?: "light" | "dark" | "auto";
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      remove: (id: string) => void;
      reset: (id?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Turnstile aktif mi (site key build-time gömülü mü) — form submit gating için. */
export const turnstileEnabled = !!SITE_KEY;

/**
 * Cloudflare Turnstile widget'ı (explicit render). Çözülen token'ı onToken ile üst forma verir;
 * süre dolar/hata olursa null döner. Site key yoksa hiçbir şey render etmez → form akışı bozulmaz
 * (dev/misconfig fail-open). "Managed" modda genelde görünmez/otomatik çözülür.
 */
export function TurnstileWidget({
  action,
  onToken,
  className,
}: {
  action?: string;
  onToken: (token: string | null) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  // onToken'ı ref'te tut → callback her render'da yeniden bağlanmasın (effect action'a bağlı).
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    function renderWidget() {
      if (cancelled || !ref.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY!,
        action,
        theme: "light",
        callback: (t) => onTokenRef.current(t),
        "expired-callback": () => onTokenRef.current(null),
        "error-callback": () => onTokenRef.current(null),
      });
    }

    // Script'i bir kez yükle; window.turnstile hazır olunca render et (onload garantisi zayıf → kısa poll).
    if (window.turnstile) {
      renderWidget();
    } else {
      if (!document.getElementById(SCRIPT_ID)) {
        const s = document.createElement("script");
        s.id = SCRIPT_ID;
        s.src = SCRIPT_SRC;
        s.async = true;
        s.defer = true;
        document.head.appendChild(s);
      }
      let waited = 0;
      const poll = setInterval(() => {
        if (cancelled || window.turnstile) {
          clearInterval(poll);
          if (!cancelled) renderWidget();
        } else if ((waited += 200) > 12000) {
          clearInterval(poll);
        }
      }, 200);
    }

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* yut */
        }
        widgetId.current = null;
      }
    };
  }, [action]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className={`cf-turnstile ${className ?? ""}`} />;
}
