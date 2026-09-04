"use client";

import type { CartItem, Product } from "@markala/types";
import { apiClient } from "./api";
import { computeAreaLine } from "./configurator";
import { fetchPricingSettings } from "./reorder";

/**
 * m² ürünü sepet satırının BİRİM fiyatını verilen adet için yeniden hesaplar (2026-09-04).
 *
 * Neden gerekli: 1 m² tabanı TOPLAM alana uygulanır (80×100 × 2 = 1,6 m²; 10×10 × 10 = 1 m²).
 * Bu yüzden birim fiyat adede bağlıdır — sepette ± ile adet değişince "eski birim × yeni adet"
 * yanlış olur. Ürünün güncel options/prices'ı ve pricing ayarı çekilip motor gerçek adetle
 * çalıştırılır (reorder.ts ile aynı kaynaklar; client/server paritesi korunur).
 *
 * Dönüş: birim fiyat (₺, KDV dahil) veya null (ürün bulunamadı / fiyatlanamadı → çağıran
 * satıra dokunmaz ve kullanıcıyı ürün sayfasına yönlendirir).
 */
export async function areaUnitPriceFor(
  item: Pick<CartItem, "productSlug" | "configuration">,
  quantity: number,
): Promise<number | null> {
  let product: Product;
  try {
    product = (await apiClient.products.detail(item.productSlug)) as Product;
  } catch {
    return null;
  }
  if (product.pricingMode !== "area") return null;
  const pricing = await fetchPricingSettings();
  const { unitPrice } = computeAreaLine(
    (product.options ?? []) as never,
    (product.prices ?? []) as never,
    (item.configuration.selections ?? {}) as Record<string, string>,
    Math.max(1, quantity),
    pricing,
  );
  return unitPrice > 0 ? unitPrice : null;
}
