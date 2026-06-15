import type { Metadata } from "next";
import { getProducts } from "@/lib/catalog";
import { ProductItemListJsonLd } from "@/components/seo/json-ld";
import { AllProductsClient } from "./all-products-client";

export const metadata: Metadata = {
  title: "Tüm Ürünler — 30+ Matbaa & Reklam Ürünü Kategorisi",
  description:
    "Matbaa baskıdan büyük format reklam ürünlerine — tüm Markala kataloğu tek ekranda. Kartvizit, broşür, branda, tabela ve daha fazlası. Tasarım desteği her siparişte ücretsiz.",
  alternates: { canonical: "/urunler" },
  openGraph: {
    type: "website",
    title: "Tüm Ürünler — Markala Kataloğu",
    description: "30+ matbaa ve reklam ürünü kategorisi. Tasarım desteği her siparişte ücretsiz.",
    url: "/urunler",
    images: [{ url: "/api/mockup?theme=brand&w=1200&h=630", width: 1200, height: 630, alt: "Markala — Tüm Ürünler" }],
  },
};

/** Server: ürünleri CANLI API'den çek (admin yönetir), interaktif filtreleme client'ta. */
export default async function AllProductsPage() {
  const products = await getProducts();
  return (
    <>
      <ProductItemListJsonLd
        products={products}
        name="Markala — Tüm Matbaa & Reklam Ürünleri"
        url="/urunler"
      />
      <AllProductsClient products={products} />
    </>
  );
}
