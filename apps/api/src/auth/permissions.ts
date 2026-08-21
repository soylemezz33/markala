import { SetMetadata } from "@nestjs/common";

/**
 * PANEL YETKİLENDİRME — 2026-08-21 (Hasan talebi: kullanıcı grupları).
 *
 * TASARIM İLKESİ: VARSAYILAN KAPALI.
 * Bugün 51 uç `@Roles("admin","super_admin")` ile korunuyor. Hepsini yeni rollere
 * açmak yerine, açılması GEREKEN uçlara açıkça `@Perms(...)` konur. Bir yeri atlarsam
 * sonuç "erişemez" olur — "yanlışlıkla görür" değil. Güvenlikte doğru varsayılan budur.
 *
 * admin ve super_admin her şeye erişir (joker izin). Yeni gruplar yalnız listelenenlere.
 */

/** İzin anahtarları — kaba taneli, menü/sayfa seviyesinde düşünüldü. */
export const PERM = {
  /** Sipariş listesi + detayını görme (tutarlar ayrıca FINANCE_READ ister). */
  ORDERS_READ: "orders.read",
  /** Sipariş durumunu ilerletme (üretim akışı). */
  ORDERS_STATUS: "orders.status",
  /** Müşteri kartı: ad, iletişim, adres. */
  CUSTOMERS_READ: "customers.read",
  /** Parasal her şey: ciro/kâr, ödemeler, iade, cari, fatura, Paraşüt. */
  FINANCE: "finance.manage",
  /** Fiyat/maliyet güncelleme. */
  PRICING: "pricing.manage",
  /** Ürün görselleri ve medya (slider, banner, portfolyo). */
  MEDIA: "media.manage",
  /** Yorumları görme/onaylama/cevaplama. */
  REVIEWS: "reviews.manage",
  /** Katalog metinleri: ürün/kategori/blog/SSS içeriği. */
  CATALOG: "catalog.manage",
  /** Sistem ayarları, entegrasyonlar, kullanıcı yönetimi. */
  SETTINGS: "settings.manage",
} as const;

export type Perm = (typeof PERM)[keyof typeof PERM];

/**
 * Rol → izinler. Buradaki liste TEK doğruluk kaynağıdır; panel menüsü de
 * (apps/admin) aynı mantığı yansıtır ama GÜVENLİK SINIRI burasıdır — menü gizlemek
 * güvenlik değildir, uç korumasıdır.
 */
export const ROLE_PERMISSIONS: Record<string, readonly Perm[] | "*"> = {
  super_admin: "*",
  admin: "*",

  /**
   * Grafik tasarımcı: işini yapmak için sipariş içeriğini ve müşteri iletişimini görür,
   * görsel/medya ve yorumları yönetir. Hasan kararı (2026-08-21): TUTARLARI GÖRMEZ —
   * bu yüzden FINANCE ve PRICING YOK. Tutar gizleme uç seviyesinde de uygulanır
   * (bkz. orders.service sanitize).
   */
  tasarimci: [
    PERM.ORDERS_READ,
    PERM.ORDERS_STATUS,
    PERM.CUSTOMERS_READ,
    PERM.MEDIA,
    PERM.REVIEWS,
  ],

  /**
   * Muhasebe: tüm para akışı, fatura/Paraşüt durumu, cari hesaplar ve fiyat güncelleme.
   * Hasan kararı: müşteri iletişim bilgilerini de görür (tahsilat için arama gerekiyor).
   * Medya/yorum/katalog içeriği YOK — menüde de görünmez.
   */
  muhasebe: [
    PERM.ORDERS_READ,
    PERM.CUSTOMERS_READ,
    PERM.FINANCE,
    PERM.PRICING,
  ],
};

/** Panele giriş yapabilen roller (müşteri hariç). */
export const PANEL_ROLES = ["super_admin", "admin", "tasarimci", "muhasebe"] as const;

export function roleHasPerm(role: string | undefined, perm: Perm): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms === "*") return true;
  return perms.includes(perm);
}

/** Rolün sahip olduğu izinler — panel menüsünü filtrelemek için /auth/me ile döner. */
export function permsForRole(role: string | undefined): Perm[] {
  if (!role) return [];
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return [];
  if (perms === "*") return Object.values(PERM);
  return [...perms];
}

export const PERMS_KEY = "perms";
/**
 * Ucu belirli izinlere açar. `@Roles` ile BİRLİKTE kullanılır:
 * Roles listesindeki rol VEYA istenen izne sahip rol geçebilir.
 */
export const Perms = (...perms: Perm[]) => SetMetadata(PERMS_KEY, perms);
