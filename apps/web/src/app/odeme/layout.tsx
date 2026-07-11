import type { Metadata } from "next";

// Ödeme akışı "use client" — kendi metadata'sı yoktu, root'u miras alıyordu.
// robots.txt zaten /odeme'yi engelliyor; bu layout sayfa seviyesinde noindex ekleyerek
// dış linkle keşif halinde indekslenmeyi de kesin engeller (çift koruma).
export const metadata: Metadata = {
  title: "Ödeme",
  robots: { index: false, follow: false },
};

export default function OdemeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
