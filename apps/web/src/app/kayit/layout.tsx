import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Üye Ol",
  description: "Markala üyelik kaydı.",
  alternates: { canonical: "/kayit" },
  robots: { index: false, follow: true },
};

export default function KayitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
