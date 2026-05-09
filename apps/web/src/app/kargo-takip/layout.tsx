import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kargo Takip — DHL ile Sipariş Sorgulama",
  description:
    "Markala siparişinizi DHL kargo takibi ile sorgulayın. Sipariş numaranızı ve e-posta adresinizi girin, kargonuzun nerede olduğunu öğrenin.",
  alternates: { canonical: "/kargo-takip" },
  robots: { index: true, follow: true, "max-snippet": 50 },
  openGraph: {
    type: "website",
    title: "Markala Kargo Takip",
    description: "Sipariş + e-posta ile hızlı kargo sorgulama.",
    url: "/kargo-takip",
  },
};

export default function KargoTakipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
