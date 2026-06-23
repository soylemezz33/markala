import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { BulkPriceClient } from "./bulk-price-client";

export default async function BulkPriceUpdatePage() {
  let products: unknown[] = [];
  let categories: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    [products, categories] = await Promise.all([
      api.products.adminList({ take: 5000 }), // TÜM ürünler (önizleme/sayım eksik kalmasın) + pasif dahil
      api.categories.list(true),
    ]);
  } catch {
    loadError = true;
  }

  return (
    <>
      {loadError && <LoadErrorBanner />}
      <BulkPriceClient
        products={products as never}
        categories={categories as never}
      />
    </>
  );
}
