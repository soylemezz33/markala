import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { NewProductClient } from "./new-product-client";

export default async function NewProductPage() {
  let categories: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    categories = await api.categories.list(true);
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <NewProductClient categories={categories as never} />
    </>
  );
}
