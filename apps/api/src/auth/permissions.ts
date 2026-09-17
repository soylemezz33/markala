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
  /** Panelden manuel sipariş oluşturma (2026-09-16: yüz yüze/telefon/WhatsApp işleri). Yalnız admin ("*"). */
  ORDERS_CREATE: "orders.create",
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
export type PanelRole = (typeof PANEL_ROLES)[number];

/**
 * İzin anahtarlarının panelde gösterilen adı/açıklaması (2026-09-17, rol yetki matrisi).
 * Sıra = ekrandaki sıra. Anahtar listesi PERM ile bire bir; biri eklenip burası unutulursa
 * aşağıdaki `PERM_LISTESI` derlemede değil testte yakalar (permissions.spec).
 */
export const PERM_META: ReadonlyArray<{ key: Perm; grup: string; label: string; aciklama: string }> = [
  { key: PERM.DASHBOARD, grup: "Genel", label: "Pano", aciklama: "Panel ana sayfası (özet kutular, son siparişler)." },
  { key: PERM.INBOX, grup: "Genel", label: "Gelen kutusu", aciklama: "E-posta günlüğü, iletişim mesajları, teklif talepleri, kurumsal başvurular. Tüm müşterilerin e-postalarını listeler (KVKK)." },
  { key: PERM.ORDERS_READ, grup: "Sipariş", label: "Siparişleri görme", aciklama: "Sipariş listesi ve detayı (ürün, adet, alıcı, dosyalar). Tutarlar ayrı izindir." },
  { key: PERM.ORDERS_AMOUNTS, grup: "Sipariş", label: "Tutarları görme", aciklama: "Sipariş ve müşteri kartındaki parasal alanlar: toplam, KDV, birim fiyat, maliyet, ödeme durumu." },
  { key: PERM.ORDERS_STATUS, grup: "Sipariş", label: "Durum ilerletme + iptal", aciklama: "Üretim akışında durum değiştirme, geri alma, sipariş iptali ve mail önizleme." },
  { key: PERM.ORDERS_TRACKING, grup: "Sipariş", label: "Kargo takip", aciklama: "Takip numarası/firma yazma ve siparişi 'Kargoya Verildi' yapma." },
  { key: PERM.ORDERS_DESIGN, grup: "Sipariş", label: "Tasarım dosyası", aciklama: "Sipariş satırına önizleme/çalışma/baskı dosyası yükleme ve silme." },
  { key: PERM.ORDERS_NOTES, grup: "Sipariş", label: "İç not", aciklama: "Sipariş iç notu yazma ve silme (müşteriye görünmez)." },
  { key: PERM.ORDERS_CREATE, grup: "Sipariş", label: "Manuel sipariş", aciklama: "Panelden yüz yüze/telefon/WhatsApp siparişi oluşturma (nakit/POS/havale)." },
  { key: PERM.CUSTOMERS_READ, grup: "Müşteri", label: "Müşteri kartı", aciklama: "Müşteri listesi: ad, iletişim, adres. Parasal alanlar için ayrıca 'Tutarları görme' gerekir." },
  { key: PERM.FINANCE, grup: "Finans", label: "Finans", aciklama: "Ciro/kâr, analitik, ödemeler, iade, cari, fatura ve Paraşüt." },
  { key: PERM.PRICING, grup: "Finans", label: "Fiyat & maliyet", aciklama: "Fiyat/maliyet güncelleme, kâr marjı, kuponlar, kampanya paketleri." },
  { key: PERM.CATALOG, grup: "İçerik", label: "Katalog içeriği", aciklama: "Ürün/kategori/blog/SSS metinleri ve menü. Fiyat ayrı izindir." },
  { key: PERM.MEDIA, grup: "İçerik", label: "Medya", aciklama: "Slider, banner, referans görselleri." },
  { key: PERM.REVIEWS, grup: "İçerik", label: "Yorumlar", aciklama: "Yorumları görme, onaylama, cevaplama." },
  { key: PERM.SETTINGS, grup: "Sistem", label: "Ayarlar", aciklama: "Site ayarları, entegrasyonlar, bülten, yasal metinler, sistem sağlığı. Yetkili yönetimi buna dahil DEĞİL (yalnız süper admin)." },
];

/** PERM_META ile senkron tutulan düz anahtar listesi. */
export const PERM_LISTESI: readonly Perm[] = PERM_META.map((m) => m.key);

/**
 * ÖZELLEŞTİRİLMİŞ ROL İZİNLERİ (2026-09-17, Hasan: "rollerin yetkilerini panelden ayarlayalım").
 *
 * ROLE_PERMISSIONS artık VARSAYILAN'dır; süper admin panelden bir rolü değiştirdiğinde
 * kayıt `panel_role_permissions` tablosuna yazılır ve RolIzinService bu haritayı besler.
 * Tüm çağıranlar (guard, /auth/me, tutar filtreleri) senkron kaldı: harita bellekte tutulur,
 * servis açılışta yükler ve periyodik tazeler → çok örnekli kurulumda da tutarlı.
 *
 * KURAL: super_admin ASLA kısıtlanamaz (paneli sahipsiz bırakma engeli); burada bir kayıt
 * olsa bile yok sayılır.
 */
let ozelRolIzinleri: Readonly<Record<string, readonly Perm[]>> = {};

export function setOzelRolIzinleri(harita: Record<string, readonly Perm[]>) {
  const temiz: Record<string, readonly Perm[]> = {};
  for (const [rol, izinler] of Object.entries(harita)) {
    if (rol === "super_admin") continue;
    if (!(PANEL_ROLES as readonly string[]).includes(rol)) continue;
    temiz[rol] = izinler.filter((p) => (PERM_LISTESI as readonly string[]).includes(p));
  }
  ozelRolIzinleri = temiz;
}

export function getOzelRolIzinleri(): Readonly<Record<string, readonly Perm[]>> {
  return ozelRolIzinleri;
}

/** Rolün panelden özelleştirilmiş bir izin seti var mı? */
export function rolOzellestirilmis(role: string | undefined): boolean {
  return !!role && role !== "super_admin" && Object.prototype.hasOwnProperty.call(ozelRolIzinleri, role);
}

/** Rolün KOD-İÇİ varsayılan izinleri ("*" → tam liste). */
export function varsayilanIzinler(role: string | undefined): Perm[] {
  if (!role) return [];
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return [];
  if (perms === "*") return [...PERM_LISTESI];
  return [...perms];
}

/**
 * Rolün TÜM izinlere sahip olup olmadığı ("joker"). RolesGuard bunu kullanır: joker rol,
 * `@Perms` işareti olmayan (yalnız @Roles ile korunan) eski uçlara da girer. Panelden
 * kısıtlanmış admin joker DEĞİLDİR → @Perms taşıyan uçlarda izin aranır.
 */
export function rolJokerMi(role: string | undefined): boolean {
  if (!role) return false;
  if (role === "super_admin") return true;
  if (rolOzellestirilmis(role)) return false;
  return ROLE_PERMISSIONS[role] === "*";
}

export function roleHasPerm(role: string | undefined, perm: Perm): boolean {
  if (!role) return false;
  if (role === "super_admin") return true;
  const ozel = ozelRolIzinleri[role];
  if (ozel) return ozel.includes(perm);
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms === "*") return true;
  return perms.includes(perm);
}

/** Rolün sahip olduğu izinler — panel menüsünü filtrelemek için /auth/me ile döner. */
export function permsForRole(role: string | undefined): Perm[] {
  if (!role) return [];
  if (role === "super_admin") return [...PERM_LISTESI];
  const ozel = ozelRolIzinleri[role];
  if (ozel) return [...ozel];
  return varsayilanIzinler(role);
}

export const PERMS_KEY = "perms";
/**
 * Ucu belirli izinlere açar. `@Roles` ile BİRLİKTE kullanılır:
 * Roles listesindeki rol VEYA istenen izne sahip rol geçebilir.
 */
export const Perms = (...perms: Perm[]) => SetMetadata(PERMS_KEY, perms);
