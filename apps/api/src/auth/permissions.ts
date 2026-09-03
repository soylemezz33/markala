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
  /** Sipariş listesi + detayını görme (tutarlar ayrıca ORDERS_AMOUNTS ister). */
  ORDERS_READ: "orders.read",
  /**
   * Sipariş yanıtında PARASAL alanları görme: total/subtotal/vat/discount/shippingFee,
   * paymentStatus/paymentMethod, items[].unitPrice/lineTotal ve items[].costTotal (maliyet).
   *
   * NEDEN AYRI ANAHTAR (2026-09-01): "kargo" rolü siparişi görmeli ama tutarı görmemeli.
   * Filtreyi FINANCE'e bağlasaydık tasarımcı da anında etkilenirdi (bugün tutarları
   * görüyor). Hasan kararı: şimdilik yalnız kargo kısıtlansın → tasarımcı/muhasebe bu
   * izni ALIR, davranışları değişmez. İleride tasarımcıda da kapatmak istenirse
   * ROLE_PERMISSIONS'tan tek satır silmek yeter.
   */
  ORDERS_AMOUNTS: "orders.amounts",
  /** Sipariş durumunu ilerletme (üretim akışı) + iptal. */
  ORDERS_STATUS: "orders.status",
  /**
   * SADECE kargo takip no / firma yazma (PATCH :id/tracking) ve siparişi "kargoya verildi"
   * işaretleme. ORDERS_STATUS'tan ayrıldı çünkü o izin sipariş İPTALİNİ (sadakat puanı
   * iadesi + müşteriye iptal maili), durumu geri almayı ve mail-önizleme ucunu da açıyor —
   * dar yetkili kargo rolü için fazla geniş.
   */
  ORDERS_TRACKING: "orders.tracking",
  /**
   * Sipariş SATIRINA tasarım dosyası yükleme/silme (2026-09-02, üretim ARGE Faz 2).
   *
   * NEDEN AYRI ANAHTAR: ORDERS_STATUS "durum ilerletme + iptal + mail-önizleme" demek; dosya
   * yazmayı ona bağlamak, ileride tasarımcıdan durum yetkisi alınırsa dosya yüklemeyi de
   * götürürdü (ya da tersi). Tasarımcı bu izni ALIR; kargo/muhasebe ALMAZ (varsayılan kapalı):
   * onlar yalnız görür/indirir (ORDERS_READ). Kod-içi değişiklik, migration gerektirmez.
   */
  ORDERS_DESIGN: "orders.design",
  /**
   * Sipariş iç notu yazma/silme (2026-09-03). ORDERS_READ'den AYRI anahtar: okuma izni
   * yazma hakkı vermemeli. TÜM panel rollerine verildi — kargo "kutu ezik geldi",
   * muhasebe "havale dekontu geldi" yazabilsin diye; not defterinin değeri herkesin
   * yazabilmesinden geliyor. Müşteri rolünde YOK, uçlar da panel guard'ının arkasında.
   */
  ORDERS_NOTES: "orders.notes",
  /** Müşteri kartı: ad, iletişim, adres. Parasal alanlar ayrıca ORDERS_AMOUNTS ister. */
  CUSTOMERS_READ: "customers.read",
  /**
   * Gelen kutusu sayfaları: e-posta kayıtları, iletişim mesajları, teklif talepleri.
   * 2026-09-01'de CUSTOMERS_READ'ten AYRILDI: o izin tek başına dört sayfayı birden
   * açıyordu ve kargo rolüne "yalnız Müşteriler görünsün" demek imkânsızdı. Ayrıca
   * /admin/notification-logs TÜM müşterilerin e-posta adreslerini sayfalayarak veriyor
   * (KVKK'da toplu PII dışa aktarımı) — bu artık ayrı ve bilinçli bir yetki.
   */
  INBOX: "inbox.read",
  /**
   * Panel ana sayfası (dashboard). Rota haritasında "/" bu izne bağlı; izni olmayan rol
   * doğrudan kendi çalışma alanına düşer. Kargo rolünün panoyu görmemesi için eklendi.
   */
  DASHBOARD: "dashboard.read",
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
   * görsel/medya ve yorumları yönetir. FINANCE ve PRICING YOK (ciro raporu ve fiyat
   * güncelleme kapalı).
   *
   * ⚠️ TUTARLAR: 2026-08-21'de "tasarımcı tutarları görmesin" kararı verilmiş ama uçtaki
   * filtre (stripAmounts) 2026-08-24'te paneli bozduğu için KALDIRILMIŞ — o tarihten beri
   * tasarımcı sipariş tutarlarını görüyor. 2026-09-01'de kargo rolü eklenirken filtre
   * ORDERS_AMOUNTS anahtarıyla yeniden yazıldı; Hasan kararı "şimdilik yalnız kargoya
   * uygula" olduğu için tasarımcıya bu izin AÇIKÇA verildi = bugünkü davranış korunur.
   * Tasarımcıda da kapatmak istenirse aşağıdaki ORDERS_AMOUNTS satırını silmek yeterli.
   */
  tasarimci: [
    PERM.DASHBOARD,
    PERM.INBOX,
    PERM.ORDERS_READ,
    PERM.ORDERS_AMOUNTS,
    PERM.ORDERS_STATUS,
    // Takip ucu ORDERS_STATUS'tan ORDERS_TRACKING'e taşındı (kargo rolü için ayrıştırma);
    // tasarımcı bugüne kadar takip no girebiliyordu, yetkisi aynen kalsın diye eklendi.
    PERM.ORDERS_TRACKING,
    // 2026-09-02 (üretim ARGE): sipariş satırına önizleme/çalışma/baskı dosyası yükler ve siler.
    PERM.ORDERS_DESIGN,
    PERM.ORDERS_NOTES,
    PERM.CUSTOMERS_READ,
    PERM.MEDIA,
    PERM.REVIEWS,
    // 2026-08-21 (Hasan): ürün görsellerini de güncelleyebilsin. Ürün düzenleme sayfası
    // katalog iznine bağlı; bu izinle ürün/kategori/blog/SSS içeriğini de düzenleyebilir.
    // Fiyat AYRI izindir (PERM.PRICING) ve tasarımcıda YOK — tutar hâlâ görünmez.
    PERM.CATALOG,
  ],

  /**
   * Muhasebe: tüm para akışı, fatura/Paraşüt durumu, cari hesaplar ve fiyat güncelleme.
   * Hasan kararı: müşteri iletişim bilgilerini de görür (tahsilat için arama gerekiyor).
   * Medya/yorum/katalog içeriği YOK — menüde de görünmez.
   */
  muhasebe: [
    PERM.DASHBOARD,
    PERM.INBOX,
    PERM.ORDERS_READ,
    PERM.ORDERS_AMOUNTS,
    PERM.ORDERS_NOTES,
    PERM.CUSTOMERS_READ,
    PERM.FINANCE,
    PERM.PRICING,
  ],

  /**
   * Kargo (2026-09-01, Hasan talebi): siparişi paketleyip gönderiyi açan iç personel.
   *
   * GÖRÜR: hangi sipariş olduğu (ürün, konfigürasyon, adet, yüklenen tasarım dosyası),
   * alıcının adı/adresi/telefonu/e-postası — hepsi sipariş detayından gelir.
   * GÖRMEZ: tutar, maliyet, ödeme durumu, fatura, cari (ORDERS_AMOUNTS ve FINANCE YOK).
   *
   * ORDERS_STATUS BİLEREK VERİLMEDİ: o izin sipariş iptalini (sadakat puanı iadesi +
   * müşteriye iptal maili), durumu geri almayı ve mail-önizleme ucunu (fiyatlı siparişi
   * keyfi adrese gönderme) da açıyor. Yerine dar ORDERS_TRACKING var: takip no yazar ve
   * siparişi yalnız "kargoya verildi"ye çeker.
   *
   * INBOX BİLEREK VERİLMEDİ: /admin/notification-logs tüm müşterilerin e-posta adreslerini
   * sayfalayarak veriyor (KVKK'da toplu PII dışa aktarımı); gelen kutusu/teklif sayfaları da
   * kargo işinin dışında. DASHBOARD da yok — panoya hiç düşmez, doğrudan Siparişler'e gelir.
   */
  kargo: [
    PERM.ORDERS_READ,
    PERM.ORDERS_TRACKING,
    PERM.ORDERS_NOTES,
    // 2026-09-01 (Hasan): "menüde sadece Siparişler ve Müşteriler görünsün".
    // CUSTOMERS_READ artık YALNIZ /musteriler'i açıyor — gelen kutusu sayfaları ve
    // toplu e-posta günlüğü INBOX'a taşındı, o izin kargoda YOK.
    // Müşteri yanıtındaki parasal alanlar (kredi limiti, iskonto, cari, sipariş tutarları)
    // ORDERS_AMOUNTS'a bağlı ve kargoda o da yok → sunucuda kesiliyor.
    PERM.CUSTOMERS_READ,
  ],
};

/** Panele giriş yapabilen roller (müşteri hariç). */
export const PANEL_ROLES = ["super_admin", "admin", "tasarimci", "muhasebe", "kargo"] as const;

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
