import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kampanyalar — Esnaf, Kurumsal, Açılış Paketleri",
  description:
    "Markala'nın hazır kampanya paketleri: esnaf başlangıç seti, kurumsal kimlik paketi, açılış kampanyası, etkinlik paketi ve promosyon paketleri. Avantajlı bundle fiyatlar.",
  alternates: { canonical: "/kampanyalar" },
  openGraph: {
    type: "website",
    title: "Markala Kampanya Paketleri",
    description: "Tek tek almak yerine hazır paketler — %20'ye kadar avantaj.",
    url: "/kampanyalar",
    images: [{ url: "/api/mockup?theme=brand&w=1200&h=630", width: 1200, height: 630, alt: "Markala Kampanyalar" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Markala Kampanya Paketleri",
    description: "Tek tek almak yerine hazır paketler — %20'ye kadar avantaj.",
    images: ["/api/mockup?theme=brand&w=1200&h=630"],
  },
};

export default function KampanyalarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
