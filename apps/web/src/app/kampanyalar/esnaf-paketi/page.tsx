import type { Metadata } from "next";
import PaketlerClient from "../paketler-client";

export const metadata: Metadata = {
  title: "Esnaf Paketleri | Dükkan ve İşletme Baskı Setleri",
  description:
    "Dükkan, ofis ve yeni açılan işletmeler için kartvizit, afiş, tabela ve tanıtım ürünlerini tek pakette topluyoruz. Tasarım desteği dahil.",
  alternates: { canonical: "/kampanyalar/esnaf-paketi" },
  openGraph: {
    type: "website",
    title: "Markala Esnaf Paketleri",
    description: "Dükkan ve işletme için kartvizit, afiş ve tanıtım ürünleri tek pakette.",
    url: "/kampanyalar/esnaf-paketi",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala Esnaf Paketleri" }],
  },
};

export default function EsnafPaketiPage() {
  return <PaketlerClient grup="esnaf" />;
}
