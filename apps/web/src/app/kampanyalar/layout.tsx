import type { Metadata } from "next";

export const metadata: Metadata = {
  // Nesne biçimi ŞART: bu layout düz bir metin `title` verdiğinde kök layout'un
  // `template: "%s · Markala"` şablonu ALT ROTALAR için düşüyor ve /kampanyalar/esnaf-paketi
  // ile /kampanyalar/secim-paketi başlıkları marka ekini kaybediyordu (9 Eki, canlıda görüldü).
  title: {
    default: "İndirimli Paketler | Esnaf ve Seçim Paketleri",
    template: "%s · Markala",
  },
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
