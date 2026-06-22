import { notFound } from "next/navigation";
import { getAdminApi } from "@/lib/api";
import { ProductDetailClient } from "./product-detail-client";

interface Props {
  params: { slug: string };
}

export default async function ProductEditPage({ params }: Props) {
  const { slug } = params;
  const api = await getAdminApi();

  let product;
  try {
    product = await api.products.detail(slug);
  } catch (e) {
    // Yalnız gerçek 404 → bulunamadı; auth/sunucu hataları (401/500) yutulmasın.
    if ((e as { status?: number })?.status === 404) notFound();
    throw e;
  }

  if (!product) notFound();

  // Kategoriler ikincil — geçici hatada ürün düzenleme yine açılsın (boş kategori listesiyle).
  let categories: unknown[] = [];
  try {
    categories = await api.categories.list(true);
  } catch {
    categories = [];
  }

  // Fiyatlama yapısı (options + prices) — hata toleranslı, boş yapıyla açılsın.
  let pricing: { options: unknown[]; prices: unknown[] } = { options: [], prices: [] };
  try {
    pricing = await api.products.getPrices((product as unknown as { id: string }).id);
  } catch {
    /* boş kalsın */
  }

  return (
    <ProductDetailClient
      product={product as never}
      categories={categories as never}
      pricing={pricing as never}
    />
  );
}
