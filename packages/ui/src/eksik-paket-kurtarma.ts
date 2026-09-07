/**
 * EKSİK PAKET (chunk) KURTARMASI — 2026-09-07.
 *
 * OLAY: Bir müşteri 4 ayrı cihazda "Beklenmeyen bir hata oluştu" ekranıyla karşılaştı;
 * bizde hiçbir sorun yoktu. Sunucu logları temizdi (200 dönüyordu) ve hata ekranında
 * "Hata kodu" satırı yoktu — ikisi birlikte hatanın TARAYICIDA oluştuğunu söylüyor.
 * nginx kayıtları kesin kanıtı verdi:
 *     404 /_next/static/chunks/main-app-1a5767507ab66852.js
 *     404 /_next/static/chunks/app/layout-dc339b0e79d1c867.js
 *
 * SEBEP: O gün ~10 kez deploy yapıldı. Her yapı yeni dosya adları üretir ve eski dosyalar
 * konteynerle birlikte anında yok olur. Tarayıcısında ÖNCEKİ yapıdan kalmış bir sayfa duran
 * kullanıcı, artık var olmayan paketleri ister; uygulama açılamaz. Sayfayı normal yenilemek
 * çözmez (aynı eski HTML önbellekten gelir), yalnız sabit yenileme (Ctrl+Shift+R) kurtarır —
 * ki sıradan bir müşteriden bunu bilmesi beklenemez.
 *
 * ÇÖZÜM: Hata bu türdense sayfayı bir kez, önbelleği atlayarak yeniden yükle. Yeni HTML
 * doğru paket adlarını taşır ve sorun kendiliğinden kapanır.
 *
 * SONSUZ DÖNGÜ TEHLİKESİ: Yenileme sonrası hata yine oluşursa (gerçekten bozuk bir yapı,
 * ağ filtresi, engelleyici eklenti) sayfa kendini sonsuza kadar yenilerdi — kullanıcı
 * siteyi hiç kullanamaz, sunucu da gereksiz yük alırdı. Bu yüzden oturum başına EN FAZLA
 * BİR kez denenir; ikinci hatada normal hata ekranı gösterilir.
 */

/** sessionStorage anahtarı — sekme kapanınca sıfırlanır, yeni ziyarette yeniden denenebilir. */
export const KURTARMA_ANAHTARI = "markala:paket-kurtarma";

/**
 * Hata, "yüklenemeyen paket" hatası mı?
 *
 * Tarayıcılar bu durumu farklı adlandırır; Next.js `ChunkLoadError` üretir, Safari ve
 * Firefox farklı metinler verir. Metin eşleşmesi kaba görünse de alternatifi yok: bu
 * hataların ortak, makine-okunur bir kodu yok.
 */
export function eksikPaketHatasiMi(hata: unknown): boolean {
  if (!hata) return false;
  const h = hata as { name?: unknown; message?: unknown };
  const ad = typeof h.name === "string" ? h.name : "";
  const mesaj = typeof h.message === "string" ? h.message : "";
  const metin = `${ad} ${mesaj}`.toLowerCase();
  return (
    metin.includes("chunkloaderror") ||
    metin.includes("loading chunk") ||
    metin.includes("failed to fetch dynamically imported module") ||
    metin.includes("error loading dynamically imported module") ||
    // Safari: "Importing a module script failed."
    metin.includes("importing a module script failed")
  );
}

/**
 * Saf karar: sayfa yeniden yüklenmeli mi?
 *
 * `dahaOnceDenendi` çağıran tarafından okunur (sessionStorage) — bu fonksiyon tarayıcı
 * API'lerine dokunmaz ki test edilebilsin.
 */
export function yenidenYuklenmeliMi(input: {
  hata: unknown;
  dahaOnceDenendi: boolean;
}): boolean {
  if (!eksikPaketHatasiMi(input.hata)) return false;
  return !input.dahaOnceDenendi;
}

/**
 * Hata sınırından çağrılır. Kurtarma gerekiyorsa işareti bırakıp sayfayı yeniler ve
 * `true` döner (çağıran hata ekranını çizmeyebilir).
 *
 * sessionStorage erişimi try/catch içinde: gizli sekmede ya da depolama kapalıyken
 * fırlatabilir; o durumda kurtarma denenmez ama hata ekranı yine de çalışır.
 */
export function eksikPaketiKurtarmayiDene(hata: unknown): boolean {
  try {
    if (typeof window === "undefined") return false;
    const dahaOnceDenendi = window.sessionStorage.getItem(KURTARMA_ANAHTARI) === "1";
    if (!yenidenYuklenmeliMi({ hata, dahaOnceDenendi })) return false;
    window.sessionStorage.setItem(KURTARMA_ANAHTARI, "1");
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}
