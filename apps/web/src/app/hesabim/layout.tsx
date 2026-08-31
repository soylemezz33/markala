import type { Metadata } from "next";

/**
 * Hesabım alanı arama motorlarına KAPALI (2026-08-31 denetimi).
 *
 * Neden layout: hesabim/page.tsx bir istemci bileşeni ("use client") olduğu için
 * `metadata` dışa aktaramıyor. Denetimde /giris, /kayit, /odeme ve /favorilerim
 * noindex'ti ama /hesabim açıktaydı — üyeye özel bir alanın indekslenmeye açık
 * durması hem gereksiz hem de arama sonuçlarında boş/yetkisiz sayfa üretir.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function HesabimLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
