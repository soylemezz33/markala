import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referanslar — Müşteri Yorumları ve Marka Listesi",
  description:
    "Markala / 324 Ajans olarak hizmet verdiğimiz markalar ve müşteri yorumları. Esnaftan kurumsal markalara 10+ yıllık tecrübe.",
  alternates: { canonical: "/referanslar" },
  openGraph: {
    type: "website",
    title: "Markala Referanslar",
    description: "Hizmet verdiğimiz markalar ve gerçek müşteri yorumları.",
    url: "/referanslar",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala Referanslar" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-default.png"] },
};

export default function ReferanslarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
