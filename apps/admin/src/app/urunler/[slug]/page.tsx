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

  // 2026-09-07: bu dört çağrı SIRAYLA bekleniyordu; hiçbiri diğerine bağlı değil (üçü
  // yalnız product.id'ye ihtiyaç duyar, o da yukarıda hazır). Paralel çalıştırılıyor.
  // allSettled: biri düşerse diğerleri yine gelsin — hepsi ikincil, sayfa açılmaya devam
  // etmeli (kategori listesi boş, fiyat matrisi boş vb. tolere edilir).
  const urunId = (product as unknown as { id: string }).id;
  const [katSonuc, fiyatSonuc, kardesSonuc, ayarSonuc] = await Promise.allSettled([
    api.categories.listLite(true),
    api.products.getPrices(urunId),
    api.prices.structureSiblings(urunId),
    api.settings.get("pricing"),
  ]);

  const categories: unknown[] = katSonuc.status === "fulfilled" ? katSonuc.value : [];

  // Fiyatlama yapısı (options + prices) — hata toleranslı, boş yapıyla açılsın.
  const pricingLoadError = fiyatSonuc.status !== "fulfilled";
  const pricing: { options: unknown[]; prices: unknown[] } =
    fiyatSonuc.status === "fulfilled"
      ? (fiyatSonuc.value as never)
      : { options: [], prices: [] };

  // Aynı kategori+yapıdaki kardeş sayısı ("Kategoriye Uygula" rozeti) — ikincil.
  const siblingCount = kardesSonuc.status === "fulfilled" ? kardesSonuc.value.count : 0;

  // m² motoru global ayarları (area editör satış önizlemesi) — eksikse default.
  let pricingSettings = { kur: 46, marj: 1.5, kdv: 0.2 };
  if (ayarSonuc.status === "fulfilled") {
    const sAyar = ayarSonuc.value as Record<string, unknown>;
    const num = (v: unknown, d: number) => {
      const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
      return Number.isFinite(n) && n > 0 ? n : d;
    };
    pricingSettings = {
      kur: num(sAyar["pricing.kur"], 46),
      marj: num(sAyar["pricing.marj"], 1.5),
      kdv: num(sAyar["pricing.kdv"], 0.2),
    };
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
