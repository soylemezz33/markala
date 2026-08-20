import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Markala hesabınıza giriş yapın.",
  alternates: { canonical: "/giris" },
  robots: { index: false, follow: true },
};

// Suspense: giriş sayfası `next` parametresini useSearchParams ile İLK render'da okuyor
// (2026-08-20 CLS düzeltmesi). Next.js, useSearchParams kullanan client bileşenin bir
// Suspense sınırı içinde olmasını şart koşar; yoksa build uyarı verir / sayfa tamamen
// client'a düşer.
export default function GirisLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
