import { getAdminApi } from "@/lib/api";
import { ProductsClient } from "./products-client";

export default async function ProductsAdminPage() {
  const api = await getAdminApi();
  const [products, categories] = await Promise.all([
    api.products.list({ take: 200 }),
    api.categories.list(true),
  ]);
  return <ProductsClient products={products as never} categories={categories as never} />;
}
