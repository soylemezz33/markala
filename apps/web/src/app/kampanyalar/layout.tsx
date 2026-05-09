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
  },
};

export default function KampanyalarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
