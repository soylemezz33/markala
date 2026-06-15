import type { Metadata } from "next";
import { getProducts } from "@/lib/catalog";
import { AllProductsClient } from "./all-products-client";

export const metadata: Metadata = {
  title: "Tüm Ürünler — 30+ Matbaa & Reklam Ürünü Kategorisi",
  description:
    "Matbaa baskıdan büyük format reklam ürünlerine — tüm Markala kataloğu tek ekranda. Kartvizit, broşür, branda, tabela ve daha fazlası. Tasarım desteği her siparişte ücretsiz.",
  alternates: { canonical: "/urunler" },
};

/** Server: ürünleri CANLI API'den çek (admin yönetir), interaktif filtreleme client'ta. */
export default async function AllProductsPage() {
  const products = await getProducts();
  return <AllProductsClient products={products} />;
}
