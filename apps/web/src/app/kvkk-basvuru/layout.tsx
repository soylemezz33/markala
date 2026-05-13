import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK Veri Sahibi Başvuru Formu — Markala",
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu 11. madde kapsamında veri sahibi başvuru formu. Verilerinizin silinmesi, düzeltilmesi, taşınması veya bilgi talebi için.",
  alternates: { canonical: "/kvkk-basvuru" },
  // KVKK formu zorunlu olarak indekslenmesi gerekmez; arama sonuçlarında ön plana çıkmasın
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function KvkkBasvuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
