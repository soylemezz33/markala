"use client";

import type { Order, OrderItem, Product } from "@markala/types";
import { apiClient } from "./api";
import { useCartStore } from "./cart-store";
import {
  computeConfiguredPrice,
  computeAreaPrice,
  DEFAULT_PRICING,
  type PricingSettings,
} from "./configurator";

/**
 * "Tekrar Sipariş Et" — teslim edilmiş bir siparişin kalemlerini AYNI konfigürasyonla
 * sepete ekler. Fiyat ASLA eski siparişten taşınmaz: ürünün güncel options/prices'ı
 * API'den çekilir ve fiyat yeniden hesaplanır (sunucu sipariş anında zaten yeniden
 * hesaplıyor; sepette de güncel tutar görünsün diye client'ta da tazelenir).
 *
 * Atlanan kalemler (ürün kaldırılmış/pasif, fiyatı hesaplanamıyor, kampanya paketi,
 * eski kayıtta seçim snapshot'ı yok) sonuçta isimleriyle raporlanır — kullanıcıya bildirilir.
 */

export interface ReorderResult {
  /** Sepete eklenen kalem sayısı */
  added: number;
  /** Atlanan kalemlerin ürün adları (kullanıcıya "şunlar eklenemedi" demek için) */
  skipped: string[];
}

/** /sepet sayfasının mount'ta okuyup göstereceği tek seferlik bilgi notu anahtarı. */
export const REORDER_NOTICE_KEY = "markala-reorder-notice";

export interface ReorderNotice {
  added: number;
  skipped: string[];
}

/** Sepet sayfasına tek seferlik "tekrar sipariş" notu bırakır (toast altyapısı yok). */
function leaveNotice(result: ReorderResult) {
  try {
    sessionStorage.setItem(REORDER_NOTICE_KEY, JSON.stringify(result satisfies ReorderNotice));
  } catch {
    // sessionStorage kapalıysa (gizli sekme vb.) not düşmeden devam — akışı bozma.
  }
}

/** Sepet sayfası: bırakılan notu okur ve SİLER (bir kez gösterilir). */
export function consumeReorderNotice(): ReorderNotice | null {
  try {
    const raw = sessionStorage.getItem(REORDER_NOTICE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(REORDER_NOTICE_KEY);
    const parsed = JSON.parse(raw) as ReorderNotice;
    if (typeof parsed?.added !== "number" || !Array.isArray(parsed?.skipped)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Pricing ayarları (kur/marj/kdv) — yalnız area üründe gerekir, tembel + tek sefer çekilir. */
async function fetchPricingSettings(): Promise<PricingSettings> {
  // Ürün sayfasıyla aynı fallback mantığı (canlı işletme değeri marj 1.2).
  const fallback: PricingSettings = { ...DEFAULT_PRICING, marj: 1.2 };
  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.markala.com.tr").replace(/\/$/, "");
  try {
    const res = await fetch(`${apiBase}/api/settings/pricing`);
    if (!res.ok) return fallback;
    const d = (await res.json()) as Partial<PricingSettings>;
    return {
      kur: typeof d.kur === "number" ? d.kur : fallback.kur,
      marj: typeof d.marj === "number" ? d.marj : fallback.marj,
      kdv: typeof d.kdv === "number" ? d.kdv : fallback.kdv,
      minM2: typeof d.minM2 === "number" ? d.minM2 : fallback.minM2,
    };
  } catch {
    return fallback;
  }
}

/**
 * Tek kalemi güncel fiyatla sepete ekler. Eklenemezse false döner (çağıran "atlandı"
 * listesine yazar). Ürün 404 → satıştan kalkmış; fiyat 0 → o konfigürasyon artık
 * fiyatlanamıyor ("Teklif Al" durumu) — ikisinde de sessizce yanlış tutarla eklemek yerine atla.
 */
async function addOrderItemToCart(
  item: OrderItem,
  getPricing: () => Promise<PricingSettings>,
): Promise<boolean> {
  const cfg = item.configuration;
  const selections = cfg?.selections;
  // Kampanya paketi kalemleri (selections.__bundle) ürün değildir; slug'ı /products'ta 404
  // verir. Eski kayıtlar da selections taşımayabilir — konfigürasyon bilinmeden ekleme yapılmaz.
  if (!selections || typeof selections !== "object" || selections.__bundle) return false;

  let product: Product & { isActive?: boolean };
  try {
    product = (await apiClient.products.detail(item.productSlug)) as Product & { isActive?: boolean };
  } catch {
    return false; // 404 (ürün kaldırılmış) veya geçici hata — kalemi atla
  }
  if (product.isActive === false) return false; // pasife alınmış ürünü sepete sokma

  // GÜNCEL fiyat: konfigüratörle aynı motorlar (client/server paritesi korunuyor).
  let totalPrice: number;
  if (product.pricingMode === "area") {
    const pricing = await getPricing();
    totalPrice = computeAreaPrice(
      (product.options ?? []) as never,
      (product.prices ?? []) as never,
      selections as Record<string, string>,
      pricing,
    ).dahil;
  } else {
    totalPrice = computeConfiguredPrice(
      (product.options ?? []) as never,
      (product.prices ?? []) as never,
      selections as Record<string, string>,
    );
  }
  if (!(totalPrice > 0)) return false; // fiyatlanamıyor → yanlış (0 ₺) tutarla ekleme

  useCartStore.getState().addItem({
    productSlug: product.slug,
    productName: product.name,
    productImage: product.images?.[0] || item.productImage,
    configuration: {
      selections: selections as Record<string, string>,
      // Özet snapshot'tan taşınır (etiketler değişmiş olsa bile seçimin dürüst tarifi).
      summary: cfg?.summary || item.configurationSummary || "",
      totalPrice,
      needsDesign: Boolean(cfg?.needsDesign),
      // Aynı tasarım dosyasıyla tekrar sipariş — dosya storage'da durduğu sürece geçerli.
      uploadedFileName: cfg?.uploadedFileName,
      uploadedFileUrl: cfg?.uploadedFileUrl,
    },
    quantity: Math.max(1, item.quantity),
  });
  return true;
}

/**
 * Siparişin tüm kalemlerini sepete ekler, sonucu döndürür ve /sepet için not bırakır.
 * Yönlendirme çağıranın işi (router.push("/sepet")).
 */
export async function reorderOrder(order: Pick<Order, "items">): Promise<ReorderResult> {
  // Pricing ayarını yalnız İLK area kalem gerektirdiğinde çek, sonra yeniden kullan.
  let pricingPromise: Promise<PricingSettings> | null = null;
  const getPricing = () => (pricingPromise ??= fetchPricingSettings());

  const result: ReorderResult = { added: 0, skipped: [] };
  for (const item of order.items) {
    const ok = await addOrderItemToCart(item, getPricing);
    if (ok) result.added += 1;
    else result.skipped.push(item.productName);
  }

  // addItem her seferinde mini sepeti (drawer) açar; /sepet'e gidileceği için kapat.
  useCartStore.getState().close();
  leaveNotice(result);
  return result;
}
