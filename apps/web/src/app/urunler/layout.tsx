import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tüm Ürünler — 30+ Matbaa & Reklam Ürünü Kategorisi",
  description:
    "Markala'nın tüm matbaa ve reklam ürünleri kataloğu: kartvizit, broşür, branda, kupa, kaşe, etiket, antetli kağıt, zarf, magnet, çanta ve daha fazlası. 1.000-10.000+ adet seçenekleri.",
  alternates: { canonical: "/urunler" },
  openGraph: {
    type: "website",
    title: "Markala — Tüm Matbaa & Reklam Ürünleri",
    description: "30+ kategori, gerçek matbaa fiyatları, ücretsiz tasarım desteği, Türkiye geneli kargo.",
    url: "/urunler",
  },
};

export default function UrunlerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
