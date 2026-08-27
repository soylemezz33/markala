import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { MarginClient } from "./margin-client";

/**
 * Kâr Marjı yönetimi — kategori ve ürün bazlı marj (2026-08-27, Hasan talebi).
 * Ürün listesi pasif dahil çekilir; marj ürün bazında da verilebilmeli.
 */
export default async function KarMarjiPage() {
  let products: unknown[] = [];
  let categories: unknown[] = [];
  let globalMarj: number | null = null;
  let loadError = false;
  try {
    const api = await getAdminApi();
    [products, categories] = await Promise.all([
      api.products.adminList({ take: 5000 }),
      api.categories.list(true),
    ]);
    // Global marj: ürünlerden herhangi birinin marj bilgisinden okunur (tek istek yeter).
    const ilk = (products as Array<{ id?: string }>)[0];
    if (ilk?.id) globalMarj = (await api.prices.marginInfo(ilk.id)).globalMargin;
  } catch {
    loadError = true;
  }

  return (
    <>
      {loadError && <LoadErrorBanner />}
      <MarginClient
        products={products as never}
        categories={categories as never}
        globalMarj={globalMarj}
      />
    </>
  );
}
