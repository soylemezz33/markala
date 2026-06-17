import { getAdminApi } from "@/lib/api";
import { NewProductClient } from "./new-product-client";

export default async function NewProductPage() {
  const api = await getAdminApi();
  const categories = await api.categories.list(true);
  return <NewProductClient categories={categories as never} />;
}
