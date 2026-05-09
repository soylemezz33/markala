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
  },
};

export default function IletisimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
