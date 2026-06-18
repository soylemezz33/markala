"use client";

// global-error.tsx — KÖK layout'un (RootLayout) kendisi render sırasında
// çökerse devreye giren tek sınır. Segment seviyesindeki `error.tsx`,
// RootLayout'un İÇİNDE render edildiği için layout'un kendi hatasını (örn.
// SiteHeader / ThemeBody / AuthBootstrap / font yüklemesi) yakalayamaz.
// Bu dosya RootLayout'un YERİNE geçer → kendi <html>/<body> ağacını ve
// stilini (globals.css) baştan kurmak zorundadır. Sadece production build'de
// çalışır; geliştirme ortamında Next.js hata overlay'i gösterir.

import { DM_Sans } from "next/font/google";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import "./globals.css";

const fontSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Kök seviyesi çöküşler en kritik hatalardır — mutlaka Sentry'ye geç.
    Sentry.captureException(error);
    console.error("[Markala Global Error Boundary]", error);
  }, [error]);

  return (
    <html lang="tr" className={fontSans.variable}>
      <body className="min-h-screen bg-paper-50 text-ink-900 font-sans antialiased grid place-items-center px-6 py-16">
        <main role="alert" aria-live="assertive" className="w-full max-w-xl text-center">
          <div
            aria-hidden="true"
            className="w-20 h-20 mx-auto rounded-full bg-error/10 grid place-items-center text-error mb-6"
          >
            {/* Bağımsız inline SVG — son çare sınırının tasarım sistemiyle
                aynı hata moduna düşmemesi için ikon paketine bağlanmaz. */}
            <svg
              width="36"
              height="36"
              viewBox="0 0 256 256"
              fill="currentColor"
              role="img"
              aria-label="Uyarı"
            >
              <path d="M236.8 188.09 149.35 36.22a24.76 24.76 0 0 0-42.7 0L19.2 188.09a23.51 23.51 0 0 0 0 23.72A24.35 24.35 0 0 0 40.55 224h174.9a24.35 24.35 0 0 0 21.33-12.19 23.51 23.51 0 0 0 .02-23.72ZM120 104a8 8 0 0 1 16 0v40a8 8 0 0 1-16 0Zm8 88a12 12 0 1 1 12-12 12 12 0 0 1-12 12Z" />
            </svg>
          </div>

          <h1 className="text-2xl md:text-4xl font-semibold leading-tight">
            Beklenmeyen bir hata oluştu
          </h1>
          <p className="mt-4 text-ink-700 max-w-md mx-auto">
            Sayfayı yüklerken kritik bir aksaklıkla karşılaştık. Yeniden yüklemeyi deneyin — sorun
            sürerse bize bildirin, hemen ilgilenelim.
          </p>

          {error.digest && (
            <code className="inline-block mt-4 px-3 py-1.5 rounded bg-paper-100 text-xs text-ink-500 font-mono">
              Hata kodu: {error.digest}
            </code>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-md text-sm font-semibold transition-colors"
            >
              Tekrar Dene
            </button>
            {/* Tam sayfa navigasyonu — çöken kök layout'u sıfırdan yeniden
                getirir; client-side geçişten daha güvenli kurtarma yolu. */}
            <a
              href="/"
              className="px-5 py-2.5 border border-paper-200 hover:border-ink-300 text-ink-900 rounded-md text-sm font-semibold transition-colors"
            >
              Anasayfa
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
