import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kategoriler | Matbaa ve Reklam Ürünleri",
  description:
    "Tüm kategoriler: kartvizit, broşür, el ilanı, afiş, antetli kağıt, zarf, magnet, etiket, bloknot, çanta, branda, rollup ve yelken bayrak.",
  alternates: { canonical: "/kategoriler" },
  openGraph: {
    type: "website",
    title: "Markala Kategoriler | Matbaa & Reklam",
    description: "30+ kategoriye göz atın, dilediğinizi seçin ve 60 saniyede sipariş verin.",
    url: "/kategoriler",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala Kategoriler" }],
  },
};

export default function KategorilerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
