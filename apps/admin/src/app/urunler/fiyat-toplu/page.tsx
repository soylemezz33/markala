import { getAdminApi } from "@/lib/api";
import { BulkPriceClient } from "./bulk-price-client";

export default async function BulkPriceUpdatePage() {
  const api = await getAdminApi();
  const [products, categories] = await Promise.all([
    api.products.list({ take: 200 }),
    api.categories.list(true),
  ]);

  return (
    <BulkPriceClient
      products={products as never}
      categories={categories as never}
    />
  );
}
