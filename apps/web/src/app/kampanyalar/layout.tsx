import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İndirimli Paketler — Esnaf, Kurumsal, Açılış Paketleri",
  description:
    "Markala'nın indirimli hazır paketleri: esnaf başlangıç seti, kurumsal kimlik paketi, açılış paketi, etkinlik ve promosyon paketleri. Tek tek almaktan daha ucuz.",
  alternates: { canonical: "/kampanyalar" },
  openGraph: {
    type: "website",
    title: "Markala İndirimli Paketler",
    description: "Tek tek almak yerine hazır paketler — %20'ye kadar avantaj.",
    url: "/kampanyalar",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala İndirimli Paketler" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Markala İndirimli Paketler",
    description: "Tek tek almak yerine hazır paketler — %20'ye kadar avantaj.",
    images: ["/og-default.png"],
  },
};

export default function KampanyalarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
