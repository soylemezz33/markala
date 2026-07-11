import type { Metadata } from "next";

// Şifre sıfırlama token'lı geçici akış — robots.txt engelli; sayfa seviyesinde de noindex.
export const metadata: Metadata = {
  title: "Şifre Sıfırla",
  robots: { index: false, follow: false },
};

export default function SifreSifirlaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
