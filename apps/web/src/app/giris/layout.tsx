import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Markala hesabınıza giriş yapın.",
  alternates: { canonical: "/giris" },
  robots: { index: false, follow: true },
};

export default function GirisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
