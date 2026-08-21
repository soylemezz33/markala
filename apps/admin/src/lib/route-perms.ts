/**
 * SAYFA → İZİN HARİTASI (2026-08-21) — panel yetkilendirmesinin TEK yol haritası.
 *
 * Neden var: menüyü gizlemek yetmedi — tasarımcı /ayarlar/genel'e URL'den girince boş
 * form gördü (Hasan bildirdi). Erişim artık middleware'de SAYFA seviyesinde zorlanıyor;
 * bu dosya hem middleware (erişim) hem admin-shell (menü) tarafından kullanılır ki
 * "menüde yok ama URL'den açılıyor" tutarsızlığı yapısal olarak imkânsız olsun.
 *
 * İzin ANAHTARLARI API'dekiyle aynı (apps/api/src/auth/permissions.ts). Rol→izin
 * eşlemesi burada YOK — o yalnız API'de yaşar; kullanıcının izin listesi girişte
 * API'den alınıp oturum çerezine yazılır. Böylece tek doğruluk kaynağı korunur.
 *
 * EŞLEME: en uzun önek kazanır. Örn. /urunler → catalog, ama /urunler/fiyat-toplu →
 * pricing; /ayarlar → settings, ama /ayarlar/fiyat → pricing.
 * Haritada OLMAYAN yol (örn. "/" dashboard) tüm panel rollerine açıktır.
 */
export const ROUTE_PERMS: ReadonlyArray<readonly [prefix: string, perm: string]> = [
  ["/analitik", "finance.manage"],
  ["/ciro", "finance.manage"],
  ["/siparisler", "orders.read"],
  ["/musteriler", "customers.read"],
  ["/iletisim-mesajlari", "customers.read"],
  ["/teklif-talepleri", "customers.read"],
  ["/bulten-aboneleri", "settings.manage"],
  ["/urunler", "catalog.manage"],
  ["/urunler/fiyat-toplu", "pricing.manage"],
  ["/fiyat-hesaplama-sablonu", "pricing.manage"],
  ["/kategoriler", "catalog.manage"],
  ["/kuponlar", "pricing.manage"],
  ["/kampanya-paketleri", "pricing.manage"],
  ["/menu", "catalog.manage"],
  ["/blog", "catalog.manage"],
  ["/sss", "catalog.manage"],
  ["/slider", "media.manage"],
  ["/banner", "media.manage"],
  ["/referanslar", "media.manage"],
  ["/yorumlar", "reviews.manage"],
  ["/yasal", "settings.manage"],
  ["/ayarlar", "settings.manage"],
  ["/ayarlar/fiyat", "pricing.manage"],
] as const;

/** Yolun gerektirdiği izin; haritada yoksa null (herkese açık panel sayfası). */
export function permForPath(pathname: string): string | null {
  let best: readonly [string, string] | null = null;
  for (const entry of ROUTE_PERMS) {
    const [prefix] = entry;
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      if (!best || prefix.length > best[0].length) best = entry;
    }
  }
  return best ? best[1] : null;
}
