import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İndirimli Paketler | Esnaf ve Seçim Paketleri",
  description:
    "Markala indirimli hazır paketleri: esnaf başlangıç seti, aday tanıtım (seçim) paketi, kurumsal kimlik, açılış ve etkinlik. Tek tek almaktan ucuz.",
  alternates: { canonical: "/kampanyalar" },
  openGraph: {
    type: "website",
    title: "Markala İndirimli Paketler",
    description: "Tek tek almak yerine hazır paketler, paket fiyatında %15 indirim.",
    url: "/kampanyalar",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala İndirimli Paketler" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Markala İndirimli Paketler",
    description: "Tek tek almak yerine hazır paketler, paket fiyatında %15 indirim.",
    images: ["/og-default.png"],
  },
};

export default function KampanyalarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
