import type { Metadata } from "next";

// Bülten çıkış sayfası "use client" (token'lı geçici akış) — eposta-dogrula ile aynı desen:
// kendine ait metadata'sı olmadığından root metadata'yı miras alırdı (duplicate title +
// thin sayfa indekslenmesi riski). Bu server layout noindex + canonical ekler.
export const metadata: Metadata = {
  title: "Bülten Aboneliğinden Çık",
  description: "Markala bülten listesinden e-posta adresini çıkar.",
  alternates: { canonical: "/bulten-cikis" },
  robots: { index: false, follow: true },
};

export default function BultenCikisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
