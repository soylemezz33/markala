import type { Metadata } from "next";

// E-posta doğrulama sayfası "use client" (token'lı geçici akış) — kendine ait
// metadata'sı olmadığı için root metadata'yı miras alıyordu (duplicate title +
// thin sayfa indekslenmesi riski). Bu server layout noindex + canonical ekler.
export const metadata: Metadata = {
  title: "E-posta Doğrulama",
  description: "Markala hesabınızın e-posta adresini doğrulayın.",
  alternates: { canonical: "/eposta-dogrula" },
  robots: { index: false, follow: true },
};

export default function EpostaDogrulaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
