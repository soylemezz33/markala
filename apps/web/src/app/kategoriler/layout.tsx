import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kategoriler — Matbaa ve Reklam Ürünleri",
  description:
    "Markala'da hizmet verdiğimiz tüm kategoriler: kartvizit, broşür, kapı askı broşür, el ilanı, afiş, antetli kağıt, zarf, magnet, etiket, makbuz, bloknot, çanta, branda, rollup, yelken bayrak ve daha fazlası.",
  alternates: { canonical: "/kategoriler" },
  openGraph: {
    type: "website",
    title: "Markala Kategoriler — Matbaa & Reklam",
    description: "30+ kategoriye göz atın, dilediğinizi seçin ve 60 saniyede sipariş verin.",
    url: "/kategoriler",
  },
};

export default function KategorilerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
