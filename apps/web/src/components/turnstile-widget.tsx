"use client";

import { useEffect, useRef, useState } from "react";

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
  // Script yüklenemez/hata verirse kullanıcı SEBEBİNİ görsün (eskiden sessizce vazgeçip
  // formu kalıcı kilitliyordu). retryKey artınca widget yeniden denenir.
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    setStatus("loading");

    function renderWidget() {
      if (cancelled || !ref.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY!,
        action,
        theme: "light",
        callback: (t) => {
          setStatus("ready");
          onTokenRef.current(t);
        },
        "expired-callback": () => onTokenRef.current(null),
        "error-callback": () => {
          setStatus("error");
          onTokenRef.current(null);
        },
      });
    }

    // Script'i (gerekirse) yükle ve TEK poll ile HEM window.turnstile HEM ref.current (div mount)
    // hazır olunca render et. Birleşik poll şart: "Yeniden dene"de status error→loading geçişi div'i
    // yeniden mount ederken senkron render ref.current=null'a düşerdi; poll sonraki tick'te yakalar.
    if (!window.turnstile && !document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onerror = () => { if (!cancelled) setStatus("error"); };
      document.head.appendChild(s);
    }
    let waited = 0;
    const poll = setInterval(() => {
      if (cancelled) {
        clearInterval(poll);
      } else if (window.turnstile && ref.current) {
        clearInterval(poll);
        renderWidget();
      } else if ((waited += 200) > 12000) {
        clearInterval(poll);
        // 12sn'de turnstile hâlâ hazır değil → hata durumu göster (sessiz kilit yerine).
        setStatus("error");
      }
    }, 200);

    return () => {
      cancelled = true;
      clearInterval(poll);
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* yut */
        }
        widgetId.current = null;
      }
    };
  }, [action, retryKey]);

  if (!SITE_KEY) return null;

  if (status === "error") {
    return (
      <div className={`text-sm ${className ?? ""}`} role="alert">
        <p className="text-error">
          Güvenlik doğrulaması yüklenemedi. İnternet bağlantını kontrol et, farklı bir ağ dene ya da
          tekrar dene.
        </p>
        <button
          type="button"
          onClick={() => {
            widgetId.current = null;
            onTokenRef.current(null);
            setRetryKey((k) => k + 1);
          }}
          className="mt-1.5 font-medium text-brand-700 underline underline-offset-2 hover:text-brand-900"
        >
          Yeniden dene
        </button>
      </div>
    );
  }

  return <div ref={ref} className={`cf-turnstile ${className ?? ""}`} />;
}
