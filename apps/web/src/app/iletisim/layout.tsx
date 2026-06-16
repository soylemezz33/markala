import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim — WhatsApp, Telefon, Mail, Mersin Adres",
  description:
    "Markala / 324 Ajans iletişim. WhatsApp, telefon, e-posta veya Mersin merkezdeki adresimize ulaşın. Müşteri hizmetleri çalışma saatleri dahil tüm kanallar.",
  alternates: { canonical: "/iletisim" },
  openGraph: {
    type: "website",
    title: "Markala İletişim",
    description: "WhatsApp, telefon, e-posta ve adres bilgileri.",
    url: "/iletisim",
    images: [{ url: "/api/mockup?theme=brand&w=1200&h=630", width: 1200, height: 630, alt: "Markala İletişim" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Markala İletişim",
    description: "WhatsApp, telefon, e-posta ve adres bilgileri.",
    images: ["/api/mockup?theme=brand&w=1200&h=630"],
  },
};

export default function IletisimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
