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
  // Pano. En uzun önek kazandığı için bu kayıt YALNIZ tam "/" yoluna uygulanır
  // (/siparisler gibi yollar kendi kaydına düşer). Kargo rolünde dashboard.read yok →
  // panoyu ne menüde görür ne de URL'den açabilir; girişte doğrudan Siparişler'e düşer.
  ["/", "dashboard.read"],
  ["/analitik", "finance.manage"],
  ["/ciro", "finance.manage"],
  ["/siparisler", "orders.read"],
  ["/musteriler", "customers.read"],
  // Kurumsal başvurular /musteriler ALTINDA olduğu için customers.read'e düşüyordu; kargo
  // rolüne müşteri kartı açılınca vergi levhası + imza sirküleri içeren bu başvuruları da
  // görecekti. Daha uzun önek kazandığı için bu satır onu ayırır. inbox.read seçildi:
  // bugün erişebilen roller (tasarımcı, muhasebe) o izne zaten sahip → davranış değişmez.
  ["/musteriler/kurumsal-basvurular", "inbox.read"],
  // Gelen kutusu sayfaları 2026-09-01'de customers.read'ten AYRILDI: o izin tek başına
  // dört sayfayı açıyordu ve kargo rolüne "yalnız Müşteriler görünsün" demek mümkün değildi.
  ["/e-postalar", "inbox.read"],
  ["/iletisim-mesajlari", "inbox.read"],
  ["/teklif-talepleri", "inbox.read"],
  ["/bulten-aboneleri", "settings.manage"],
  ["/urunler", "catalog.manage"],
  ["/urunler/fiyat-toplu", "pricing.manage"],
  ["/urunler/kar-marji", "pricing.manage"],
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

/**
 * Rolün girebileceği İLK sayfa — yetkisiz yönlendirmelerin hedefi.
 *
 * Neden gerekli: eskiden yetkisiz istek koşulsuz "/" (pano) sayfasına atılıyordu. Pano
 * artık dashboard.read istiyor; panosu olmayan bir rol (kargo) "/" isteyince yine "/"a
 * atılırdı → SONSUZ YÖNLENDİRME. Bu yüzden hedef, kullanıcının gerçekten erişebildiği
 * ilk sayfa olarak hesaplanır.
 */
export function varsayilanRota(perms: readonly string[] | undefined | null): string {
  const p = perms ?? [];
  const sirali = ["/", "/siparisler", "/musteriler", "/urunler", "/yorumlar", "/ayarlar"];
  for (const yol of sirali) {
    const need = permForPath(yol);
    if (!need || p.includes(need)) return yol;
  }
  // Hiçbir sayfaya yetkisi yok — panelde işi yok, girişe döner.
  return "/giris";
}

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
