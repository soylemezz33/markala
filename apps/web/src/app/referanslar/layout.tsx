import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Referanslarımız | Markala Online Matbaa" },
  description:
    "Restoran, butik, kuyumcu, emlak, eczane ve daha fazlası — Markala Türkiye'nin 81 iline kurumsal matbaa ve reklam ürünleri üretiyor. Markanız da referanslarımız arasına katılsın.",
  alternates: { canonical: "/referanslar" },
  openGraph: {
    type: "website",
    title: "Referanslarımız | Markala Online Matbaa",
    description: "Markala'nın hizmet verdiği sektörler ve kurumsal matbaa çözümleri.",
    url: "/referanslar",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala Referanslar" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-default.png"] },
};

export default function ReferanslarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
