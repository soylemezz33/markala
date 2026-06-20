"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Kök layout'un KENDİSİ çökerse devreye giren en üst hata sınırı.
 * error.tsx yalnız layout ALTINDAKİ hataları yakalar; bu dosya html/body dahil
 * her şeyi kendi render eder. globals.css yüklenmeyebileceği için inline stil kullanır
 * (marka rengi #F5B800 / kağıt #F8F4E8 / mürekkep #1A1410).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[Markala Global Error]", error);
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#F8F4E8",
          color: "#1A1410",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ fontSize: 28, margin: "0 0 12px", fontWeight: 600 }}>
            Beklenmeyen bir hata oluştu
          </h1>
          <p style={{ color: "#5c5347", lineHeight: 1.6, margin: "0 0 24px" }}>
            Sistemimizde geçici bir aksaklık var. Sayfayı yeniden yüklemeyi deneyin;
            sorun sürerse bize bildirin, hemen ilgilenelim.
          </p>
          {error?.digest && (
            <div
              style={{
                display: "inline-block",
                background: "#efe9da",
                padding: "6px 10px",
                borderRadius: 6,
                fontSize: 12,
                color: "#5c5347",
                marginBottom: 24,
                fontFamily: "ui-monospace, monospace",
              }}
            >
              Hata kodu: {error.digest}
            </div>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
            <button
              onClick={() => reset()}
              style={{
                background: "#F5B800",
                color: "#1A1410",
                border: "none",
                padding: "12px 22px",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Tekrar Dene
            </button>
            <a
              href="/"
              style={{
                border: "1px solid #d9d2c2",
                color: "#1A1410",
                padding: "12px 22px",
                borderRadius: 8,
                fontWeight: 600,
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Anasayfa
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
