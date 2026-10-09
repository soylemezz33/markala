import type { Metadata } from "next";
import PaketlerClient from "../paketler-client";

export const metadata: Metadata = {
  title: "Seçim Paketleri | Aday Tanıtım Malzemesi",
  description:
    "Oda, dernek, kooperatif ve sendika seçimlerine giren adaylar için kartvizit, el ilanı, branda afiş, dekota pano ve bayrak tek pakette. Az, orta ve fazla miktar olarak üç boy.",
  alternates: { canonical: "/kampanyalar/secim-paketi" },
  openGraph: {
    type: "website",
    title: "Markala Seçim Paketleri",
    description: "Aday tanıtım malzemesi tek pakette: kartvizit, el ilanı, branda afiş, pano ve bayrak.",
    url: "/kampanyalar/secim-paketi",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala Seçim Paketleri" }],
  },
};

export default function SecimPaketiPage() {
  return <PaketlerClient grup="secim" />;
}
