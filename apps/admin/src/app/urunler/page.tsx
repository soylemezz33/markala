import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { ProductsClient } from "./products-client";

export default async function ProductsAdminPage() {
  let products: unknown[] = [];
  let categories: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    [products, categories] = await Promise.all([
      api.products.adminList({ take: 5000 }), // pasif ürünler dahil tüm ürünler
      api.categories.list(true),
    ]);
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <ProductsClient products={products as never} categories={categories as never} />
    </>
  );
}
