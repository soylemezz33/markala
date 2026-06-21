import type { Metadata } from "next";

// Sayfa "use client" olduğu için metadata page.tsx'te tanımlanamaz;
// diğer public rotalarla tutarlı şekilde sibling layout'tan veriliyor.
export const metadata: Metadata = {
  title: "Kurumsal Hesap Başvurusu — Cari Hesap & Açık Fatura",
  description:
    "Markala kurumsal hesap başvuru formu. Vergi levhası ve imza sirküleri ile başvurun; cari hesap, 30 gün açık fatura ve firmanıza özel avantajlı fiyatlandırmadan yararlanın.",
  alternates: { canonical: "/kurumsal/basvuru" },
  openGraph: {
    type: "website",
    title: "Markala Kurumsal Hesap Başvurusu",
    description:
      "Cari hesap, açık fatura ve kademeli indirim için kurumsal başvurunuzu birkaç dakikada tamamlayın.",
    url: "/kurumsal/basvuru",
  },
};

export default function KurumsalBasvuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
