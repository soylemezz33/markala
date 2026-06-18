import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { CategoriesClient } from "./categories-client";

export default async function CategoriesAdminPage() {
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
      <CategoriesClient categories={categories as never} />
    </>
  );
}
