import type { Metadata } from "next";

// Sayfa "use client" olduğu için metadata page.tsx'te tanımlanamaz;
// diğer public rotalarla tutarlı şekilde sibling layout'tan veriliyor.
export const metadata: Metadata = {
  title: "Kurumsal Hesap Başvurusu | Açık Fatura",
  description:
    "Kurumsal hesap başvuru formu. Vergi levhası ve imza sirküleriyle başvurun; cari hesap, 30 gün açık fatura ve firmanıza özel fiyattan yararlanın.",
  alternates: { canonical: "/kurumsal/basvuru" },
  openGraph: {
    type: "website",
    title: "Markala Kurumsal Hesap Başvurusu",
    description:
      "Cari hesap, açık fatura ve kademeli indirim için kurumsal başvurunuzu birkaç dakikada tamamlayın.",
    url: "/kurumsal/basvuru",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala Kurumsal Hesap Başvurusu" }],
  },
};

export default function KurumsalBasvuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
