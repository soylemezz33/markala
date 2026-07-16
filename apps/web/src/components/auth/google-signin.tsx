"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GsiButtonConfig {
  type?: string;
  theme?: string;
  size?: string;
  text?: string;
  shape?: string;
  logo_alignment?: string;
  width?: number;
  locale?: string;
}
interface GoogleAccountsId {
  initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }) => void;
  renderButton: (el: HTMLElement, cfg: GsiButtonConfig) => void;
}
declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

/**
 * "Google ile devam et" — Google Identity Services resmî butonu.
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID yoksa HİÇ render olmaz (flag-gated, sıfır-etki).
 * ID token backend'de doğrulanır (aud + email_verified); e-posta Google'ca kanıtlı
 * olduğundan katı e-posta doğrulama sürtünmesi bu akışta yoktur.
 */
export function GoogleSignIn({ next }: { next?: string | null }) {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const slotRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID || !slotRef.current) return;

    let cancelled = false;
    function renderButton() {
      const gsi = window.google?.accounts?.id;
      if (cancelled || !gsi || !slotRef.current) return;
      gsi.initialize({
        client_id: CLIENT_ID as string,
        callback: async ({ credential }) => {
          setBusy(true);
          setError(null);
          const res = await loginWithGoogle(credential);
          setBusy(false);
          if (res.ok) {
            router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/hesabim");
          } else {
            setError(res.error ?? "Google ile giriş başarısız.");
          }
        },
      });
      gsi.renderButton(slotRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
        width: 320,
        locale: "tr",
      });
    }

    if (window.google?.accounts?.id) {
      renderButton();
    } else {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = renderButton;
      document.head.appendChild(s);
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next]);

  if (!CLIENT_ID) return null;

  return (
    <div className="space-y-2">
      <div className="relative flex items-center gap-3 text-xs text-ink-500">
        <span className="flex-1 border-t border-paper-200" aria-hidden />
        veya
        <span className="flex-1 border-t border-paper-200" aria-hidden />
      </div>
      <div className="flex justify-center min-h-[44px]" ref={slotRef} aria-busy={busy} />
      {error && (
        <p role="alert" className="text-xs text-error text-center">{error}</p>
      )}
    </div>
  );
}
