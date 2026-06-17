import { getAdminApi } from "@/lib/api";
import { CategoriesClient } from "./categories-client";

export default async function CategoriesAdminPage() {
  const api = await getAdminApi();
  const categories = await api.categories.list(true);

  return <CategoriesClient categories={categories as never} />;
}
