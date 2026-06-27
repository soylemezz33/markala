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
  let pricingLoadError = false;
  try {
    pricing = await api.products.getPrices((product as unknown as { id: string }).id);
  } catch {
    pricingLoadError = true;
  }

  // Aynı kategori+yapıdaki kardeş sayısı ("Kategoriye Uygula" rozeti) — ikincil, hata yutulur.
  let siblingCount = 0;
  try {
    const r = await api.prices.structureSiblings((product as unknown as { id: string }).id);
    siblingCount = r.count;
  } catch {
    siblingCount = 0;
  }

  // m² motoru global ayarları (area editör satış önizlemesi) — eksikse default.
  let pricingSettings = { kur: 46, marj: 1.5, kdv: 0.2 };
  try {
    const s = (await api.settings.get("pricing")) as Record<string, unknown>;
    const num = (v: unknown, d: number) => {
      const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
      return Number.isFinite(n) && n > 0 ? n : d;
    };
    pricingSettings = {
      kur: num(s["pricing.kur"], 46),
      marj: num(s["pricing.marj"], 1.5),
      kdv: num(s["pricing.kdv"], 0.2),
    };
  } catch {
    // default kalır
  }

  return (
    <ProductDetailClient
      product={product as never}
      categories={categories as never}
      pricing={pricing as never}
      pricingLoadError={pricingLoadError}
      siblingCount={siblingCount}
      pricingSettings={pricingSettings}
    />
  );
}
