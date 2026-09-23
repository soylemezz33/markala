import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ücretsiz Numune Kutusu | Kağıt Örnekleri",
  description:
    "Sipariş öncesi kâğıt gramajını, selefon ve baskı kalitesini elinizle görün. Numune kutusunu adresinize ücretsiz gönderelim; 81 ile 2-3 iş günü.",
  alternates: { canonical: "/numune-talebi" },
  openGraph: {
    type: "website",
    title: "Ücretsiz Numune Kutusu | Markala",
    description:
      "Kâğıt gramajı, selefon ve baskı kalitesini sipariş öncesi elinizle görün. Numune kutusu adresinize ücretsiz.",
    url: "/numune-talebi",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala Numune Kutusu" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-default.png"] },
};

export default function NumuneTalebiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
