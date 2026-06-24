import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teklif Al — İşletmenize Özel Matbaa Teklifi",
  description:
    "İşletmenize özel matbaa & reklam ürünleri teklifi alın. Sektörünüzü ve ihtiyacınızı belirtin, 24 saat içinde özel fiyat + ücretsiz tasarım önerisi hazırlayalım. Toplu işlerde indirim, kurumsal cari hesap.",
  alternates: { canonical: "/teklif-al" },
  openGraph: {
    type: "website",
    title: "Teklif Al — Markala",
    description:
      "İşletmenize özel matbaa teklifi: 24 saatte özel fiyat + ücretsiz tasarım. Toplu işlerde indirim, kurumsal cari hesap.",
    url: "/teklif-al",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala Teklif Al" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-default.png"] },
};

export default function TeklifAlLayout({ children }: { children: React.ReactNode }) {
  return children;
}
