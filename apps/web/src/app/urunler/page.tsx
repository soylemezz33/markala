import type { Metadata } from "next";
import { getProducts, getCategories } from "@/lib/catalog";
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
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Markala — Tüm Ürünler" }],
  },
};

/** Server: ürünleri CANLI API'den çek (admin yönetir), interaktif filtreleme client'ta.
 *
 * `?kategoriler=a,b,c&grup=Etiket` — header mega menüsündeki "Tüm X ürünlerini gör"
 * linkleri buraya gelir: nav grubu birden çok düz kategoriye yayıldığından (İSG=10
 * kategori) tek kategori filtresi yetmez; grup ön-filtre olarak açılır. Bilinmeyen
 * slug'lar elenir; hiç geçerli slug kalmazsa normal (filtresiz) katalog gösterilir.
 */
export default async function AllProductsPage({
  searchParams,
}: {
  searchParams?: { kategoriler?: string; grup?: string };
}) {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  const known = new Set(categories.map((c) => c.slug));
  const slugs = (searchParams?.kategoriler ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => known.has(s));
  const initialGroup =
    slugs.length > 0
      ? { label: searchParams?.grup?.trim() || "Seçili Kategoriler", slugs }
      : null;

  return (
    <>
      <ProductItemListJsonLd
        products={products}
        name="Markala — Tüm Matbaa & Reklam Ürünleri"
        url="/urunler"
      />
      <AllProductsClient products={products} categories={categories} initialGroup={initialGroup} />
    </>
  );
}
