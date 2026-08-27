"use server";
import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/revalidate-web";

/**
 * KÂR MARJI aksiyonları (2026-08-27).
 *
 * Marj = satış / maliyet çarpanı (1.8 → %80 kâr). Üç seviyede tanımlanır ve en özel olan
 * kazanır: ÜRÜN → KATEGORİ → GLOBAL (ayarlar).
 *
 * ÖNEMLİ: marjı KAYDETMEK fiyatları değiştirmez. Fiyatlar ancak "uygula" denince
 * maliyetten yeniden hesaplanır — ve önce her zaman önizleme gösterilir. Böylece
 * maliyet ve satış fiyatı elle girilebilir olmaya devam eder; marj bir hesap aracıdır.
 */

export async function marjBilgisi(productId: string) {
  const api = await getAdminApi();
  return api.prices.marginInfo(productId);
}

export async function marjKaydet(input: {
  scope: "product" | "category";
  targetId: string;
  margin: number | null;
}) {
  const api = await getAdminApi();
  const r = await api.prices.setMargin(input);
  revalidatePath("/urunler/kar-marji");
  return r;
}

/** dryRun=true → yalnız önizleme (hiçbir şey yazılmaz). */
export async function marjUygula(input: {
  scope: "product" | "category";
  targetId: string;
  margin?: number;
  dryRun?: boolean;
}) {
  const api = await getAdminApi();
  const r = await api.prices.applyMargin(input);
  if (input.dryRun === false) {
    revalidatePath("/urunler");
    await revalidateStorefront();
  }
  return r;
}
